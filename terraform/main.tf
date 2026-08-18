locals {
  name_prefix = "${var.project}-${var.environment}"
}

# ── Lambda source packaging ─────────────────────────────────────────────────
data "archive_file" "get_upload_url" {
  type        = "zip"
  source_file = "${path.module}/../src/handlers/get_upload_url.py"
  output_path = "${path.module}/.builds/get_upload_url.zip"
}

data "archive_file" "start_transcription" {
  type        = "zip"
  source_file = "${path.module}/../src/handlers/start_transcription.py"
  output_path = "${path.module}/.builds/start_transcription.zip"
}

data "archive_file" "process_transcription_result" {
  type        = "zip"
  source_file = "${path.module}/../src/handlers/process_transcription_result.py"
  output_path = "${path.module}/.builds/process_transcription_result.zip"
}

data "archive_file" "synthesize_speech" {
  type        = "zip"
  source_file = "${path.module}/../src/handlers/synthesize_speech.py"
  output_path = "${path.module}/.builds/synthesize_speech.zip"
}

data "archive_file" "get_jobs" {
  type        = "zip"
  source_file = "${path.module}/../src/handlers/get_jobs.py"
  output_path = "${path.module}/.builds/get_jobs.zip"
}

# ── Modules ──────────────────────────────────────────────────────────────────
module "dynamodb" {
  source = "./modules/dynamodb"

  name_prefix = local.name_prefix
}

module "s3" {
  source = "./modules/s3"

  name_prefix           = local.name_prefix
  cors_allowed_origin    = var.cors_allowed_origin
  audio_retention_days   = var.audio_retention_days
  audio_expiry_days      = var.audio_expiry_days
}

module "cognito" {
  source = "./modules/cognito"

  name_prefix            = local.name_prefix
  cognito_domain_prefix  = var.cognito_domain_prefix
  oauth_callback_urls    = var.oauth_callback_urls
}

module "lambda" {
  source = "./modules/lambda"

  name_prefix         = local.name_prefix
  environment         = var.environment
  aws_region          = var.aws_region
  log_retention_days  = var.log_retention_days
  job_ttl_days        = var.job_ttl_days
  alert_email         = var.alert_email

  s3_bucket_arn        = module.s3.bucket_arn
  s3_bucket_name       = module.s3.bucket_name
  dynamodb_table_arn   = module.dynamodb.table_arn
  dynamodb_table_name  = module.dynamodb.table_name

  get_upload_url_zip                    = data.archive_file.get_upload_url.output_path
  get_upload_url_zip_hash               = data.archive_file.get_upload_url.output_base64sha256
  start_transcription_zip               = data.archive_file.start_transcription.output_path
  start_transcription_zip_hash          = data.archive_file.start_transcription.output_base64sha256
  process_transcription_result_zip      = data.archive_file.process_transcription_result.output_path
  process_transcription_result_zip_hash = data.archive_file.process_transcription_result.output_base64sha256
  synthesize_speech_zip                 = data.archive_file.synthesize_speech.output_path
  synthesize_speech_zip_hash            = data.archive_file.synthesize_speech.output_base64sha256
  get_jobs_zip                          = data.archive_file.get_jobs.output_path
  get_jobs_zip_hash                     = data.archive_file.get_jobs.output_base64sha256
}

module "eventbridge" {
  source = "./modules/eventbridge"

  name_prefix                               = local.name_prefix
  process_transcription_result_lambda_arn   = module.lambda.process_transcription_result_arn
  process_transcription_result_lambda_name  = module.lambda.process_transcription_result_name
}

module "api_gateway" {
  source = "./modules/api_gateway"

  name_prefix          = local.name_prefix
  environment          = var.environment
  cors_allowed_origin   = var.cors_allowed_origin

  cognito_user_pool_client_id = module.cognito.user_pool_client_id
  cognito_issuer_url          = module.cognito.issuer_url

  synthesize_speech_lambda_invoke_arn = module.lambda.synthesize_speech_invoke_arn
  synthesize_speech_lambda_name       = module.lambda.synthesize_speech_name
  get_upload_url_lambda_invoke_arn    = module.lambda.get_upload_url_invoke_arn
  get_upload_url_lambda_name          = module.lambda.get_upload_url_name
  get_jobs_lambda_invoke_arn          = module.lambda.get_jobs_invoke_arn
  get_jobs_lambda_name                = module.lambda.get_jobs_name
}

module "frontend" {
  source = "./modules/frontend"

  name_prefix = local.name_prefix
  aws_region  = var.aws_region

  api_base_url                 = module.api_gateway.api_endpoint
  cognito_user_pool_id          = module.cognito.user_pool_id
  cognito_user_pool_client_id   = module.cognito.user_pool_client_id
  cognito_domain                = module.cognito.user_pool_domain
}
