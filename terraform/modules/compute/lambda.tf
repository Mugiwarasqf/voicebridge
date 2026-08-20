# ── Lambda execution permissions -- the role's identity lives in the
# security module (modules/security/main.tf); this inline policy lives here
# instead, next to the resources it grants access to, to avoid the module
# dependency cycle documented on aws_iam_role.lambda_exec in
# modules/security/main.tf.
resource "aws_iam_role_policy" "lambda_permissions" {
  name = "${var.name_prefix}-lambda-policy"
  role = var.lambda_exec_role_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AudioBucketAccess"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.audio.arn,
          "${aws_s3_bucket.audio.arn}/*"
        ]
      },
      {
        Sid    = "JobsTableAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/*"
        ]
      },
      {
        Sid      = "PollySynthesis"
        Effect   = "Allow"
        Action   = ["polly:SynthesizeSpeech", "polly:DescribeVoices"]
        Resource = "*" # Polly does not support resource-level permissions
      },
      {
        Sid      = "TranscribeJobs"
        Effect   = "Allow"
        Action   = ["transcribe:StartTranscriptionJob", "transcribe:GetTranscriptionJob"]
        Resource = "*" # Transcribe does not support resource-level permissions
      }
    ]
  })
}

# ── Log groups (created up front so retention is set before first invoke) ─────
resource "aws_cloudwatch_log_group" "get_upload_url" {
  name              = "/aws/lambda/${var.name_prefix}-get-upload-url"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "start_transcription" {
  name              = "/aws/lambda/${var.name_prefix}-start-transcription"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "process_transcription_result" {
  name              = "/aws/lambda/${var.name_prefix}-process-transcription-result"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "synthesize_speech" {
  name              = "/aws/lambda/${var.name_prefix}-synthesize-speech"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "get_jobs" {
  name              = "/aws/lambda/${var.name_prefix}-get-jobs"
  retention_in_days = var.log_retention_days
}

locals {
  common_env = {
    DYNAMODB_TABLE  = var.dynamodb_table_name
    S3_BUCKET_NAME  = aws_s3_bucket.audio.bucket
    AWS_REGION_NAME = var.aws_region
    ENVIRONMENT     = var.environment
    JOB_TTL_DAYS    = tostring(var.job_ttl_days)
  }
}

# ── POST /stt/uploads -> presigned S3 PUT URL + job record ────────────────────
resource "aws_lambda_function" "get_upload_url" {
  function_name    = "${var.name_prefix}-get-upload-url"
  role             = var.lambda_exec_role_arn
  handler          = "get_upload_url.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory_mb
  timeout          = var.lambda_timeout_seconds
  filename         = var.get_upload_url_zip
  source_code_hash = var.get_upload_url_zip_hash

  environment {
    variables = local.common_env
  }

  depends_on = [aws_cloudwatch_log_group.get_upload_url]
}

# ── S3 uploads/ trigger -> kicks off the Transcribe job ────────────────────────
resource "aws_lambda_function" "start_transcription" {
  function_name    = "${var.name_prefix}-start-transcription"
  role             = var.lambda_exec_role_arn
  handler          = "start_transcription.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory_mb
  timeout          = var.lambda_timeout_seconds
  filename         = var.start_transcription_zip
  source_code_hash = var.start_transcription_zip_hash

  environment {
    variables = local.common_env
  }

  depends_on = [aws_cloudwatch_log_group.start_transcription]
}

resource "aws_lambda_permission" "s3_invoke_start_transcription" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.start_transcription.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.audio.arn
}

resource "aws_s3_bucket_notification" "audio_uploaded" {
  bucket = aws_s3_bucket.audio.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.start_transcription.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
  }

  depends_on = [aws_lambda_permission.s3_invoke_start_transcription]
}

# ── EventBridge "Transcribe Job State Change" -> writes the result to DynamoDB ─
resource "aws_lambda_function" "process_transcription_result" {
  function_name    = "${var.name_prefix}-process-transcription-result"
  role             = var.lambda_exec_role_arn
  handler          = "process_transcription_result.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory_mb
  timeout          = 30
  filename         = var.process_transcription_result_zip
  source_code_hash = var.process_transcription_result_zip_hash

  environment {
    variables = local.common_env
  }

  depends_on = [aws_cloudwatch_log_group.process_transcription_result]
}

# ── POST /tts -> synchronous Polly synthesis (<=3000 chars) ───────────────────
resource "aws_lambda_function" "synthesize_speech" {
  function_name    = "${var.name_prefix}-synthesize-speech"
  role             = var.lambda_exec_role_arn
  handler          = "synthesize_speech.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory_mb
  timeout          = 25 # Polly on long inputs can approach the API Gateway 29s ceiling
  filename         = var.synthesize_speech_zip
  source_code_hash = var.synthesize_speech_zip_hash

  environment {
    variables = local.common_env
  }

  depends_on = [aws_cloudwatch_log_group.synthesize_speech]
}

# ── GET /jobs, GET /jobs/{jobId} -> history + status polling ──────────────────
resource "aws_lambda_function" "get_jobs" {
  function_name    = "${var.name_prefix}-get-jobs"
  role             = var.lambda_exec_role_arn
  handler          = "get_jobs.handler"
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory_mb
  timeout          = var.lambda_timeout_seconds
  filename         = var.get_jobs_zip
  source_code_hash = var.get_jobs_zip_hash

  environment {
    variables = local.common_env
  }

  depends_on = [aws_cloudwatch_log_group.get_jobs]
}

# ── Alarm: any function erroring repeatedly ────────────────────────────────────
resource "aws_sns_topic" "alerts" {
  name = "${var.name_prefix}-alerts"
}

resource "aws_sns_topic_subscription" "alert_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = toset([
    aws_lambda_function.get_upload_url.function_name,
    aws_lambda_function.start_transcription.function_name,
    aws_lambda_function.process_transcription_result.function_name,
    aws_lambda_function.synthesize_speech.function_name,
    aws_lambda_function.get_jobs.function_name,
  ])

  alarm_name          = "${each.value}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "Triggers when ${each.value} errors more than 3 times in 5 minutes."
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = each.value
  }
}
