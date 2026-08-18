variable "project" {
  description = "Project name prefix used in resource names."
  type        = string
  default     = "voicebridge"
}

variable "environment" {
  description = "Deployment environment (dev / staging / prod)."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region. Must support Polly, Transcribe and Cognito."
  type        = string
  default     = "eu-west-2"
}

variable "alert_email" {
  description = "Email address subscribed to CloudWatch alarms (Lambda errors, DLQ depth)."
  type        = string
}

variable "audio_retention_days" {
  description = "Days before audio objects (uploads + synthesized speech) transition to Infrequent Access."
  type        = number
  default     = 30
}

variable "audio_expiry_days" {
  description = "Days before audio objects are permanently deleted."
  type        = number
  default     = 180
}

variable "job_ttl_days" {
  description = "Days before a job record is purged from DynamoDB via TTL."
  type        = number
  default     = 90
}

variable "cognito_domain_prefix" {
  description = "Globally-unique prefix for the Cognito Hosted UI domain, e.g. 'voicebridge-yourname'."
  type        = string
}

variable "oauth_callback_urls" {
  description = "URLs Cognito Hosted UI may redirect back to. Starts at localhost; add your cloudfront_url after the first apply and re-apply (see README)."
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "cors_allowed_origin" {
  description = "Origin allowed to call the API (your CloudFront URL). Use '*' only for local dev."
  type        = string
  default     = "*"
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention for Lambda log groups."
  type        = number
  default     = 14
}
