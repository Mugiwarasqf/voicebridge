# Account Configuration Reference

Every place you need to insert your own details before deploying VoiceBridge.

---

## 1. AWS Authentication

Pick one:

### Option A - Named AWS profile (local development)
```bash
aws configure --profile voicebridge
export AWS_PROFILE=voicebridge
```

### Option B - Environment variables (CI/CD)
```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_DEFAULT_REGION="eu-west-2"
```
Prefer GitHub Actions OIDC over long-lived keys - see `.github/workflows/deploy.yml`.

### Option C - IAM role
No configuration needed if Terraform runs from an EC2/CodeBuild/ECS
principal that already has an attached role with the required permissions.

---

## 2. Terraform Remote State (optional, recommended once you're past solo use)

**File:** `terraform/providers.tf` - uncomment the `backend "s3"` block and
create the bucket + lock table once (commands are in the README's
"One-Time Setup" section).

---

## 3. Deployment Variables

**File:** `terraform/terraform.tfvars` (copy from `terraform.tfvars.example`)

| Variable | What to set |
|---|---|
| `alert_email` | Where CloudWatch alarm notifications go |
| `cognito_domain_prefix` | Must be globally unique across all of AWS, e.g. `voicebridge-yourname` |
| `aws_region` | Leave as `eu-west-2` unless you want a different region (must support Polly + Transcribe) |
| `cors_allowed_origin` | `"*"` for local dev; your CloudFront URL for production |
| `oauth_callback_urls` | Starts at `["http://localhost:5173"]`; add your `cloudfront_url` after the first apply |

---

## 4. Required IAM Permissions

The principal running Terraform needs to manage: S3, DynamoDB, Lambda, IAM
(to create the Lambda execution role), API Gateway v2, Cognito, EventBridge,
CloudWatch Logs/Alarms, SNS, CloudFront. For a quick start,
`AdministratorAccess` on a dedicated dev account is simplest; scope it down
to specific resource ARNs before this touches production.

---

## 5. Post-Deployment

```bash
terraform output
```

| Output | What it's for |
|---|---|
| `cloudfront_url` | The app itself - open this in a browser |
| `api_base_url` | Base URL the frontend calls (already baked into `index.html`) |
| `cognito_user_pool_id` / `cognito_user_pool_client_id` | Already baked into `index.html`; useful if you build a second client (mobile app, etc.) |

---

## Summary Checklist

- [ ] AWS credentials configured
- [ ] `terraform.tfvars` created with `alert_email` + unique `cognito_domain_prefix`
- [ ] First `terraform apply` done, `cloudfront_url` copied into `oauth_callback_urls`
- [ ] Second `terraform apply` done
- [ ] Confirmed SNS alert-email subscription (check your inbox)
- [ ] Signed up a test user via the Hosted UI and confirmed the email verification code
