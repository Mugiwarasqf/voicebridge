# 🎙️ VoiceBridge - Text/Speech Converter

An AWS-native serverless web app that converts text to natural-sounding
speech and speech to text, using Amazon Polly and Amazon Transcribe. No
servers to manage, no ML models to train or host.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Architecture Overview](#architecture-overview)
3. [Architecture Decisions & Trade-offs](#architecture-decisions--trade-offs)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [One-Time Setup](#one-time-setup)
7. [Quick Start](#quick-start)
8. [API Reference](#api-reference)
9. [Module Reference](#module-reference)
10. [Security](#security)
11. [Observability](#observability)
12. [Cost Estimate](#cost-estimate)
13. [Known Limitations & Next Steps](#known-limitations--next-steps)
14. [Destroying the Infrastructure](#destroying-the-infrastructure)

---

## Problem Statement

Text-to-speech and speech-to-text are usually sold as separate SaaS products
with per-seat pricing, even though the underlying capability (Polly,
Transcribe) is pay-per-use AWS infrastructure anyone can provision directly.
This project is a self-hosted, serverless alternative: run it in your own
AWS account, pay only for what you actually synthesize or transcribe, and
own the whole stack - which also makes it a clean starting point for a
metered, multi-tenant product if you decide to sell access to it.

---

## Architecture Overview

```
Browser (Cognito Hosted UI login)
        │
        ▼
CloudFront / S3 (static frontend)
        │
        │ HTTPS + JWT
        ▼
API Gateway (HTTP API, Cognito JWT authorizer)
        │
   ┌────┼────────────────┬───────────────┐
   ▼    ▼                ▼               ▼
POST /tts   POST /stt/uploads   GET /jobs[/{id}]
   │              │
   ▼              ▼
Lambda:         Lambda:
synthesize_     get_upload_url
speech            │
   │              ▼ (presigned PUT)
   ▼         Browser uploads audio directly to S3 (uploads/)
Polly              │
   │               ▼ S3 ObjectCreated event
   ▼         Lambda: start_transcription
S3 (outputs/)      │
   │               ▼
   ▼         Amazon Transcribe (async job)
DynamoDB           │
(jobs table)       ▼ EventBridge: "Transcribe Job State Change"
   ▲         Lambda: process_transcription_result
   └─────────────────┘
      writes transcript back to DynamoDB
```

**Text-to-speech** is synchronous: the Lambda calls Polly, writes the MP3 to
S3, and returns a playable presigned URL in the same HTTP response.

**Speech-to-text** is asynchronous by necessity - Transcribe jobs take
anywhere from 15 seconds to a few minutes. The client gets a `jobId`
immediately and polls `GET /jobs/{jobId}` until Transcribe finishes and
EventBridge fans the result back into DynamoDB.

---

## Architecture Decisions & Trade-offs

### 1. Presigned S3 upload instead of routing audio through API Gateway

**Decision:** `POST /stt/uploads` returns a presigned S3 PUT URL; the browser
uploads the audio file directly to S3, not through Lambda.

**Why:** API Gateway caps request payloads at 10 MB and Lambda at 6 MB
(synchronous). Audio files - especially anything beyond a short voice memo -
blow past that fast. Direct-to-S3 upload has no such ceiling and skips
Lambda entirely for the (potentially large) file transfer.

**Trade-off:** Two round trips instead of one, and the client has to handle
the intermediate "get a URL, then PUT to it" dance instead of a single POST.

---

### 2. S3 event -> Transcribe -> EventBridge, not a synchronous /stt call

**Decision:** Starting a transcription job and reading its result are two
separate, decoupled Lambdas connected by an S3 event and an EventBridge rule.

**Why:** Transcribe has no synchronous API - a job takes at minimum ~15-30
seconds even for a short clip, which is well past what you want a browser
tab (or API Gateway's 29-second timeout) sitting and waiting on. Decoupling
means the upload response is instant and processing retries independently
of the client's connection.

**Trade-off:** The frontend has to poll for job status. A production version
would likely add a WebSocket API (API Gateway WebSocket + a `connections`
table) or push a browser notification instead - flagged as a next step
below rather than built here, to keep the core flow easy to read.

---

### 3. Recovering `userId`/`jobId` from the S3 media URI, not the Transcribe job name

**Decision:** `process_transcription_result.py` calls
`GetTranscriptionJob` and parses `Media.MediaFileUri` (which still contains
the original `uploads/{userId}/{jobId}.ext` key) rather than encoding both
IDs into the Transcribe job name itself.

**Why:** Transcribe job names are capped at 200 characters and restricted to
a narrow charset; Cognito `sub` values plus UUIDs comfortably fit, but
parsing the already-known S3 key is simpler and doesn't couple the job
naming scheme to two different ID formats.

**Trade-off:** One extra `GetTranscriptionJob` API call per completed job -
negligible cost, and it avoids a DynamoDB GSI that would exist for this one
lookup alone.

---

### 4. HTTP API (v2) instead of REST API (v1)

**Decision:** API Gateway HTTP API with a native Cognito **JWT** authorizer,
not a REST API with a Cognito **User Pool** authorizer.

**Why:** ~3.5x cheaper per million requests, built-in CORS handling (no
manual OPTIONS/MOCK integrations), and the JWT authorizer needs no Lambda
invocation to validate a token.

**Trade-off:** No request validation models or per-method throttling like
REST API offers. Fine here since every Lambda validates its own input; would
reconsider for a public third-party API with less-trusted callers.

---

### 5. Synchronous Polly for text-to-speech, with a documented text-length limit

**Decision:** `/tts` calls `polly.synthesize_speech` directly and returns
the audio URL in the response. Text over 3,000 characters is rejected with a
400, rather than silently falling back to something else.

**Why:** Polly's synchronous API tops out at 3,000 characters; this covers
the overwhelming majority of "read this paragraph/article snippet aloud"
use cases with an instant round trip and zero extra infrastructure.

**Trade-off:** Long-form content (a whole article, an e-book chapter) needs
Polly's asynchronous `StartSpeechSynthesisTask`, which writes directly to
S3 the same way Transcribe does. That's a natural extension of this same
pattern (see [Known Limitations](#known-limitations--next-steps)) but isn't
built in v1.

---

### 6. Cognito Hosted UI (implicit grant) instead of a custom login form

**Decision:** The frontend redirects to Cognito's Hosted UI for sign-in/
sign-up and reads the `id_token` back from the URL fragment.

**Why:** Zero custom auth code, zero password-handling liability, and no
backend needed to exchange an authorization code for tokens (the frontend
is 100% static).

**Trade-off:** The Hosted UI's default styling is basic, and the implicit
grant is being phased out industry-wide in favour of authorization-code +
PKCE. For a real launch, swap in PKCE (still no backend required - it just
needs a bit more JS) and/or a custom-branded login page.

---

## Project Structure

```
voicebridge/
├── terraform/
│   ├── main.tf                   Root module - wires everything together
│   ├── variables.tf / outputs.tf
│   ├── providers.tf              AWS provider + remote state (commented out by default)
│   ├── terraform.tfvars.example  Copy -> terraform.tfvars and customise
│   └── modules/
│       ├── cognito/       User Pool, Hosted UI domain, OAuth app client
│       ├── s3/             Single audio bucket (uploads/, outputs/, transcripts/)
│       ├── dynamodb/       Jobs table + GSI for history queries
│       ├── lambda/          5 functions, shared IAM role, log groups, alarms
│       ├── api_gateway/    HTTP API, JWT authorizer, routes
│       ├── eventbridge/    Transcribe job-state-change rule -> Lambda
│       └── frontend/        S3 + CloudFront (OAC), templated index.html
├── src/handlers/
│   ├── get_upload_url.py               POST /stt/uploads
│   ├── start_transcription.py          S3 trigger (uploads/*)
│   ├── process_transcription_result.py EventBridge trigger
│   ├── synthesize_speech.py            POST /tts
│   └── get_jobs.py                     GET /jobs, GET /jobs/{jobId}
├── frontend/
│   ├── index.html.tpl   Templated with API/Cognito config at apply time
│   ├── app.js
│   └── styles.css
├── .github/workflows/deploy.yml
├── ACCOUNT_CONFIG.md      <- WHERE TO PUT YOUR ACCOUNT DETAILS
└── README.md
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Terraform | >= 1.6.0 | https://developer.hashicorp.com/terraform/install |
| AWS CLI | >= 2.x | https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html |
| Python | 3.12 | Only needed if running handlers locally |

AWS services used (all in a single region, default `eu-west-2`):
API Gateway, Lambda, S3, DynamoDB, Cognito, Polly, Transcribe, EventBridge,
CloudFront, SNS, CloudWatch.

> Polly and Transcribe are available in most commercial regions but not all
> - check the [AWS regional services list](https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/)
> before changing `aws_region`.

---

## One-Time Setup

1. **(Optional but recommended) Create the Terraform state backend** before
   your first apply, so state isn't just sitting on your laptop:
   ```bash
   aws s3api create-bucket --bucket voicebridge-tfstate --region eu-west-2 \
     --create-bucket-configuration LocationConstraint=eu-west-2
   aws s3api put-bucket-versioning --bucket voicebridge-tfstate --versioning-configuration Status=Enabled
   aws dynamodb create-table --table-name voicebridge-tf-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST
   ```
   Then uncomment the `backend "s3"` block in `terraform/providers.tf`.

2. **Set up an IAM role for GitHub Actions** (OIDC, not long-lived access
   keys) if you want CI/CD - see `.github/workflows/deploy.yml`. Add its ARN
   as the `AWS_DEPLOY_ROLE_ARN` repo secret.

3. **Two-phase apply for Cognito's callback URL.** The Hosted UI needs to
   know your CloudFront URL, but CloudFront's domain name doesn't exist
   until after the first apply. Run `terraform apply` once with the default
   `oauth_callback_urls = ["http://localhost:5173"]`, copy the printed
   `cloudfront_url` output into `terraform.tfvars`, then `terraform apply`
   again. Only the Cognito app client changes on the second run.

---

## Quick Start

```bash
cd voicebridge/terraform
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: alert_email, cognito_domain_prefix (must be globally unique)

terraform init
terraform plan
terraform apply          # first apply
# copy the cloudfront_url output into oauth_callback_urls in terraform.tfvars
terraform apply          # second apply, fixes up the Cognito callback URL

terraform output cloudfront_url
```

Open the URL, sign up (check your email for the verification code), sign
in, and try both panels.

---

## API Reference

All routes require `Authorization: Bearer <Cognito id_token>`.

### POST /tts

```json
{ "text": "Hello world", "voiceId": "Joanna", "engine": "neural", "isSsml": false }
```
→ `200 OK`
```json
{ "jobId": "...", "audioUrl": "https://...presigned S3 URL, valid 1 hour" }
```
`text` over 3,000 characters returns `400` (see trade-off #5 above).

### POST /stt/uploads

```json
{ "filename": "memo.m4a", "languageCode": "en-US" }
```
→ `201 Created`
```json
{ "jobId": "...", "uploadUrl": "https://...presigned S3 PUT URL, valid 5 min", "audioKey": "uploads/..." }
```
Omit `languageCode` to let Transcribe auto-detect the spoken language.
Supported formats: mp3, mp4, m4a, wav, flac, ogg, webm, amr.

### GET /jobs?type=&limit=&lastKey=

→ `200 OK`
```json
{ "jobs": [ { "jobId": "...", "type": "tts", "status": "completed", "...": "..." } ], "nextKey": null }
```

### GET /jobs/{jobId}

→ `200 OK` - single job record, used for polling STT status
(`status`: `awaiting_upload` → `processing` → `completed` | `failed`).

---

## Module Reference

| Module | Resources Created |
|---|---|
| `cognito` | User Pool, Hosted UI domain, OAuth app client (implicit grant) |
| `s3` | Audio bucket: versioning, encryption, lifecycle, CORS |
| `dynamodb` | Jobs table with `userId-createdAt-index` GSI, PITR enabled |
| `lambda` | 5 functions, shared IAM role, CloudWatch log groups, error alarms + SNS |
| `eventbridge` | Rule matching Transcribe job completion/failure -> Lambda target |
| `api_gateway` | HTTP API, JWT authorizer, 4 routes, access logging |
| `frontend` | S3 + CloudFront (Origin Access Control), templated static site |

---

## Security

- All S3 access is private; the browser only ever gets short-lived presigned
  URLs (5 min for uploads, 1 hour for audio playback/download).
- S3 public access fully blocked; CloudFront reaches the bucket via Origin
  Access Control, not a public bucket policy.
- DynamoDB encrypted at rest with Point-in-Time Recovery enabled.
- Every Lambda's IAM role is scoped to the specific S3 bucket, DynamoDB
  table, Polly and Transcribe actions it needs - nothing broader.
- API Gateway validates the Cognito JWT before any Lambda runs.
- Job records auto-expire via DynamoDB TTL (`job_ttl_days`, default 90);
  audio objects transition to Infrequent Access and then delete on a
  lifecycle policy (`audio_retention_days` / `audio_expiry_days`).

---

## Observability

- **CloudWatch Logs** for all 5 Lambdas and API Gateway access logs.
- **CloudWatch Alarms** on each Lambda's `Errors` metric (>3 in 5 minutes),
  wired to an SNS topic you subscribe to via `alert_email`.
- Enable **AWS X-Ray** by adding `tracing_config` to the Lambda module if
  you need end-to-end request tracing - left out of v1 to keep the module
  minimal.

---

## Cost Estimate

For light usage (~500 TTS requests + ~100 STT minutes/month, eu-west-2):

| Service | Estimated Monthly Cost |
|---|---|
| Polly Neural (500 requests, ~200 words avg) | ~$1.60 (500 × 200 words × 5 chars ≈ 500K chars × $16/1M) |
| Transcribe (100 minutes) | ~$2.40 (100 × $0.024/min) |
| Lambda | ~$0.00 (within free tier) |
| API Gateway (HTTP API) | ~$0.00 (within free tier) |
| DynamoDB (PAY_PER_REQUEST) | ~$0.05 |
| S3 + CloudFront | ~$0.50 |
| Cognito (< 50,000 MAU) | $0.00 (free tier) |
| **Total** | **~$4.55/month** |

Costs scale roughly linearly with usage - Polly and Transcribe are the two
line items that matter once you have real traffic.

---

## Known Limitations & Next Steps

- **Long-form TTS** (>3,000 characters) needs Polly's asynchronous
  `StartSpeechSynthesisTask` API, following the same "write to S3, notify on
  completion" pattern already used for STT. Not built in v1.
- **Polling, not push.** The frontend polls `GET /jobs/{jobId}` every 3
  seconds for STT status. A WebSocket API (or SNS -> browser push) would
  remove the polling delay.
- **No usage metering or billing.** If you want to sell access to this,
  add an API Gateway usage plan + API keys (or a per-user quota check in
  each Lambda against a `monthlyUsage` counter in DynamoDB) and a Stripe
  webhook Lambda for subscription/metered billing.
- **Single AWS account.** Fine solo; move to AWS Organizations with a
  separate account per environment before onboarding real customers, so
  billing and blast radius stay isolated.
- **Hosted UI implicit grant** should move to authorization-code + PKCE
  before a public launch (see trade-off #6).

---

## Destroying the Infrastructure

```bash
cd terraform
terraform destroy
```

> ⚠️ This permanently deletes all resources, including the DynamoDB jobs
> table and every object in the audio bucket. There's nothing to export
> here (audio/transcripts are ephemeral by design), but double-check before
> running this against a real environment.
