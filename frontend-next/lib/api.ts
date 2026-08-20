// Typed API client for all VoiceBridge backend routes.
// All routes require Authorization: Bearer <Cognito id_token>.

export interface TtsRequest {
  text: string;
  voiceId: string;
  engine: "standard" | "neural";
  isSsml?: boolean;
}

export interface TtsResponse {
  jobId: string;
  audioUrl: string;
}

export interface SttUploadRequest {
  filename: string;
  languageCode?: string;
}

export interface SttUploadResponse {
  jobId: string;
  uploadUrl: string;
  audioKey: string;
}

export type JobStatus =
  | "awaiting_upload"
  | "processing"
  | "completed"
  | "failed";

export interface Job {
  jobId: string;
  type: "tts" | "stt";
  status: JobStatus;
  createdAt: string;
  audioUrl?: string;
  transcriptText?: string;
  errorMessage?: string;
}

export interface JobsResponse {
  jobs: Job[];
  nextKey: string | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken: () => string | null
  ) {}

  private async request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string>),
      Authorization: `Bearer ${token}`,
    };
    if (init.body && typeof init.body === "string") {
      headers["Content-Type"] = "application/json";
    }

    // amazonq-ignore-next-line
    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `Request failed (${res.status})` }));
      throw new ApiError(
        (err as { message?: string }).message ?? `Request failed (${res.status})`,
        res.status
      );
    }

    if (res.status === 204) return null as T;
    return res.json() as Promise<T>;
  }

  async postTts(req: TtsRequest): Promise<TtsResponse> {
    return this.request<TtsResponse>("/tts", {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  async postSttUpload(req: SttUploadRequest): Promise<SttUploadResponse> {
    return this.request<SttUploadResponse>("/stt/uploads", {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  /** Upload a file directly to S3 via the presigned PUT URL (no auth header). */
  async putToS3(
    uploadUrl: string,
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
      }
      xhr.onload = () => {
        // amazonq-ignore-next-line
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new ApiError("Upload to S3 failed", xhr.status));
      };
      xhr.onerror = () => reject(new ApiError("Network error during upload", 0));
      xhr.send(file);
    });
  }

  async getJobs(params?: {
    type?: "tts" | "stt";
    limit?: number;
    lastKey?: string;
  }): Promise<JobsResponse> {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.lastKey) qs.set("lastKey", params.lastKey);
    const query = qs.toString() ? `?${qs}` : "";
    return this.request<JobsResponse>(`/jobs${query}`);
  }

  async getJob(jobId: string): Promise<Job> {
    return this.request<Job>(`/jobs/${jobId}`);
  }

  /** Poll GET /jobs/{jobId} until status is terminal or timeout is reached. */
  async pollJob(
    jobId: string,
    {
      intervalMs = 3000,
      timeoutMs = 180_000,
      onStatus,
    }: {
      intervalMs?: number;
      timeoutMs?: number;
      onStatus?: (status: JobStatus) => void;
    } = {}
  ): Promise<Job> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const job = await this.getJob(jobId);
      onStatus?.(job.status);
      if (job.status === "completed" || job.status === "failed") return job;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new ApiError("Timed out waiting for transcription", 408);
  }
}
