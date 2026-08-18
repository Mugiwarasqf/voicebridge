<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VoiceBridge - Text/Speech Converter</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <!-- Baked in at `terraform apply` time - no build step for the frontend. -->
  <script>
    window.VB_CONFIG = {
      apiBaseUrl: "${api_base_url}",
      cognitoUserPoolId: "${cognito_user_pool_id}",
      cognitoClientId: "${cognito_client_id}",
      cognitoDomain: "${cognito_domain}",
      awsRegion: "${aws_region}"
    };
  </script>

  <header class="topbar">
    <h1>VoiceBridge</h1>
    <div id="auth-area">
      <button id="login-btn">Sign in</button>
      <button id="logout-btn" hidden>Sign out</button>
      <span id="user-email"></span>
    </div>
  </header>

  <main id="app" hidden>
    <section class="card">
      <h2>Text &rarr; Speech</h2>
      <textarea id="tts-text" maxlength="3000" placeholder="Type or paste up to 3000 characters..."></textarea>
      <div class="row">
        <label>Voice
          <select id="tts-voice">
            <option value="Joanna">Joanna (US English)</option>
            <option value="Matthew">Matthew (US English)</option>
            <option value="Amy">Amy (British English)</option>
            <option value="Brian">Brian (British English)</option>
            <option value="Lupe">Lupe (US Spanish)</option>
          </select>
        </label>
        <label>Engine
          <select id="tts-engine">
            <option value="neural">Neural (higher quality)</option>
            <option value="standard">Standard (cheaper)</option>
          </select>
        </label>
        <button id="tts-submit">Synthesize</button>
      </div>
      <p id="tts-status" class="status"></p>
      <audio id="tts-player" controls hidden></audio>
    </section>

    <section class="card">
      <h2>Speech &rarr; Text</h2>
      <input type="file" id="stt-file" accept="audio/*" />
      <button id="stt-submit">Transcribe</button>
      <p id="stt-status" class="status"></p>
      <pre id="stt-transcript" class="transcript" hidden></pre>
    </section>

    <section class="card">
      <div class="row space-between">
        <h2>History</h2>
        <button id="history-refresh">Refresh</button>
      </div>
      <table id="history-table">
        <thead>
          <tr><th>Type</th><th>Created</th><th>Status</th><th>Result</th></tr>
        </thead>
        <tbody id="history-body"></tbody>
      </table>
    </section>
  </main>

  <script src="/app.js"></script>
</body>
</html>
