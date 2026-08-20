variable "name_prefix" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "cors_allowed_origin" {
  type = string
}

variable "audio_retention_days" {
  type = number
}

variable "audio_expiry_days" {
  type = number
}

variable "log_retention_days" {
  type = number
}

variable "lambda_runtime" {
  type    = string
  default = "python3.12"
}

variable "lambda_memory_mb" {
  type    = number
  default = 256
}

variable "lambda_timeout_seconds" {
  type    = number
  default = 15
}

variable "job_ttl_days" {
  type = number
}

variable "alert_email" {
  type = string
}

# From the security module
variable "lambda_exec_role_arn" {
  type = string
}

variable "lambda_exec_role_name" {
  type = string
}

variable "cognito_user_pool_id" {
  type = string
}

variable "cognito_user_pool_client_id" {
  type = string
}

variable "cognito_issuer_url" {
  type = string
}

variable "cognito_domain" {
  type = string
}

# From the database module
variable "dynamodb_table_arn" {
  type = string
}

variable "dynamodb_table_name" {
  type = string
}

# Packaged zips (built in root main.tf via archive_file)
variable "get_upload_url_zip" {
  type = string
}
variable "get_upload_url_zip_hash" {
  type = string
}

variable "start_transcription_zip" {
  type = string
}
variable "start_transcription_zip_hash" {
  type = string
}

variable "process_transcription_result_zip" {
  type = string
}
variable "process_transcription_result_zip_hash" {
  type = string
}

variable "synthesize_speech_zip" {
  type = string
}
variable "synthesize_speech_zip_hash" {
  type = string
}

variable "get_jobs_zip" {
  type = string
}
variable "get_jobs_zip_hash" {
  type = string
}
