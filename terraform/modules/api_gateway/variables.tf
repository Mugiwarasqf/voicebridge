variable "name_prefix" {
  type = string
}

variable "environment" {
  type = string
}

variable "cors_allowed_origin" {
  type = string
}

variable "cognito_user_pool_client_id" {
  type = string
}

variable "cognito_issuer_url" {
  type = string
}

variable "synthesize_speech_lambda_invoke_arn" {
  type = string
}
variable "synthesize_speech_lambda_name" {
  type = string
}

variable "get_upload_url_lambda_invoke_arn" {
  type = string
}
variable "get_upload_url_lambda_name" {
  type = string
}

variable "get_jobs_lambda_invoke_arn" {
  type = string
}
variable "get_jobs_lambda_name" {
  type = string
}
