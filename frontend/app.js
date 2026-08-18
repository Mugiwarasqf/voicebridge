// VoiceBridge frontend - plain JS, no build step, no framework.
// Auth: Cognito Hosted UI, implicit grant (id_token comes back in the URL
// fragment). Token is kept in sessionStorage only - cleared when the tab closes.

const CFG = window.VB_CONFIG;

const hostedUiBase = `https://${CFG.cognitoDomain}.auth.${CFG.awsRegion}.amazoncognito.com`;
const redirectUri = window.location.origin + window.location.pathname;

function loginUrl() {
  const params = new URLSearchParams({
    client_id: CFG.cognitoClientId,
    response_type: "token",
    scope: "openid email",
    redirect_uri: redirectUri,
  });
  return `${hostedUiBase}/login?${params.toString()}`;
}

function logoutUrl() {
  const params = new URLSearchParams({
    client_id: CFG.cognitoClientId,
    logout_uri: redirectUri,
  });
  return `${hostedUiBase}/logout?${params.toString()}`;
}

function captureTokenFromHash() {
  if (!window.location.hash.includes("id_token")) return;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const idToken = params.get("id_token");
  if (idToken) {
    sessionStorage.setItem("vb_id_token", idToken);
    history.replaceState({}, document.title, redirectUri);
  }
}

function getIdToken() {
  return sessionStorage.getItem("vb_id_token");
}

function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

async function apiFetch(path, options = {}) {
  const token = getIdToken();
  const headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
  if (options.body && !(options.body instanceof Blob)) {
    headers["Content-Type"] = "application/json";
  }
  // amazonq-ignore-next-line
  const res = await fetch(`${CFG.apiBaseUrl}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

// ── Auth wiring ────────────────────────────────────────────────────────────
function updateAuthUi() {
  const token = getIdToken();
  document.getElementById("login-btn").hidden = !!token;
  document.getElementById("logout-btn").hidden = !token;
  document.getElementById("app").hidden = !token;
  document.getElementById("user-email").textContent = token ? (decodeJwt(token).email || "") : "";
}

document.getElementById("login-btn").addEventListener("click", () => {
  window.location.href = loginUrl();
});

document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("vb_id_token");
  window.location.href = logoutUrl();
});

// ── Text -> Speech ───────────────────────────────────────────────────────────
document.getElementById("tts-submit").addEventListener("click", async () => {
  const text = document.getElementById("tts-text").value.trim();
  const voiceId = document.getElementById("tts-voice").value;
  const engine = document.getElementById("tts-engine").value;
  const statusEl = document.getElementById("tts-status");
  const player = document.getElementById("tts-player");

  if (!text) {
    statusEl.textContent = "Enter some text first.";
    return;
  }

  statusEl.textContent = "Synthesizing...";
  try {
    const result = await apiFetch("/tts", {
      method: "POST",
      body: JSON.stringify({ text, voiceId, engine }),
    });
    const blob = await fetch(result.audioUrl).then(r => r.blob());
    player.src = URL.createObjectURL(blob);
    player.hidden = false;
    statusEl.textContent = "Done.";
    loadHistory();
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
  }
});

// ── Speech -> Text ───────────────────────────────────────────────────────────
document.getElementById("stt-submit").addEventListener("click", async () => {
  const fileInput = document.getElementById("stt-file");
  const statusEl = document.getElementById("stt-status");
  const transcriptEl = document.getElementById("stt-transcript");
  const file = fileInput.files[0];

  if (!file) {
    statusEl.textContent = "Choose an audio file first.";
    return;
  }

  transcriptEl.hidden = true;
  statusEl.textContent = "Requesting upload URL...";
  try {
    const { jobId, uploadUrl } = await apiFetch("/stt/uploads", {
      method: "POST",
      body: JSON.stringify({ filename: file.name }),
    });

    statusEl.textContent = "Uploading audio...";
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
    });
    // amazonq-ignore-next-line
    if (!putRes.ok) throw new Error("Upload to S3 failed.");

    statusEl.textContent = "Transcribing (this can take 30s-2min)...";
    const job = await pollJob(jobId);

    if (job.status === "completed") {
      statusEl.textContent = "Done.";
      transcriptEl.textContent = job.transcriptText;
      transcriptEl.hidden = false;
    } else {
      statusEl.textContent = `Failed: ${job.errorMessage || "unknown error"}`;
    }
    loadHistory();
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
  }
});

async function pollJob(jobId, { intervalMs = 3000, timeoutMs = 180000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = await apiFetch(`/jobs/${jobId}`);
    if (job.status === "completed" || job.status === "failed") return job;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Timed out waiting for transcription.");
}

// ── History ──────────────────────────────────────────────────────────────────
async function playHistoryAudio(btn) {
  const url = btn.dataset.url;
  const blob = await fetch(url).then(r => r.blob());
  const audio = new Audio(URL.createObjectURL(blob));
  audio.play();
}

// amazonq-ignore-next-line
async function loadHistory() {
  const body = document.getElementById("history-body");
  try {
    const { jobs } = await apiFetch("/jobs?limit=20");
    body.innerHTML = jobs.map(rowHtml).join("") || `<tr><td colspan="4">No jobs yet.</td></tr>`;
  } catch (err) {
    // amazonq-ignore-next-line
    body.innerHTML = `<tr><td colspan="4">Failed to load history: ${err.message}</td></tr>`;
  }
}

function rowHtml(job) {
  const created = new Date(job.createdAt).toLocaleString();
  let result = "-";
  if (job.type === "tts" && job.audioUrl) {
    result = `<button onclick="playHistoryAudio(this)" data-url="${job.audioUrl}">▶ Play</button>`;
  } else if (job.type === "stt" && job.transcriptText) {
    const preview = job.transcriptText.slice(0, 80);
    result = preview + (job.transcriptText.length > 80 ? "..." : "");
  } else if (job.status === "failed") {
    result = job.errorMessage || "Failed";
  }
  return `<tr><td>${job.type.toUpperCase()}</td><td>${created}</td><td>${job.status}</td><td>${result}</td></tr>`;
}

document.getElementById("history-refresh").addEventListener("click", loadHistory);

// ── Boot ─────────────────────────────────────────────────────────────────────
captureTokenFromHash();
updateAuthUi();
if (getIdToken()) loadHistory();
