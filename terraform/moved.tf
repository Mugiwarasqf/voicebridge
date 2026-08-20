# State is currently empty (a fresh `terraform destroy` was run before this
# restructure), so these are no-ops today -- `terraform plan` shows the same
# all-creates result with or without them. Included anyway as the template
# for the next restructure against a live stack: without a `moved` block, a
# resource's module path is part of its state identity, so Terraform would
# plan to destroy the old-path resource and create a new one at the new path
# -- for the DynamoDB table or the S3 buckets' contents, that's real data
# loss, not just a relabeling.

moved {
  from = module.dynamodb.aws_dynamodb_table.jobs
  to   = module.database.aws_dynamodb_table.jobs
}

# ── cognito -> security ─────────────────────────────────────────────────────
moved {
  from = module.cognito.aws_cognito_user_pool.main
  to   = module.security.aws_cognito_user_pool.main
}
moved {
  from = module.cognito.aws_cognito_user_pool_client.app
  to   = module.security.aws_cognito_user_pool_client.app
}
moved {
  from = module.cognito.aws_cognito_user_pool_domain.main
  to   = module.security.aws_cognito_user_pool_domain.main
}

# ── lambda -> security (role identity only) / compute (everything else) ────
moved {
  from = module.lambda.aws_iam_role.lambda_exec
  to   = module.security.aws_iam_role.lambda_exec
}
moved {
  from = module.lambda.aws_iam_role_policy_attachment.basic_execution
  to   = module.security.aws_iam_role_policy_attachment.basic_execution
}
moved {
  from = module.lambda.aws_iam_role_policy.lambda_permissions
  to   = module.compute.aws_iam_role_policy.lambda_permissions
}
moved {
  from = module.lambda.aws_cloudwatch_log_group.get_upload_url
  to   = module.compute.aws_cloudwatch_log_group.get_upload_url
}
moved {
  from = module.lambda.aws_cloudwatch_log_group.start_transcription
  to   = module.compute.aws_cloudwatch_log_group.start_transcription
}
moved {
  from = module.lambda.aws_cloudwatch_log_group.process_transcription_result
  to   = module.compute.aws_cloudwatch_log_group.process_transcription_result
}
moved {
  from = module.lambda.aws_cloudwatch_log_group.synthesize_speech
  to   = module.compute.aws_cloudwatch_log_group.synthesize_speech
}
moved {
  from = module.lambda.aws_cloudwatch_log_group.get_jobs
  to   = module.compute.aws_cloudwatch_log_group.get_jobs
}
moved {
  from = module.lambda.aws_lambda_function.get_upload_url
  to   = module.compute.aws_lambda_function.get_upload_url
}
moved {
  from = module.lambda.aws_lambda_function.start_transcription
  to   = module.compute.aws_lambda_function.start_transcription
}
moved {
  from = module.lambda.aws_lambda_function.process_transcription_result
  to   = module.compute.aws_lambda_function.process_transcription_result
}
moved {
  from = module.lambda.aws_lambda_function.synthesize_speech
  to   = module.compute.aws_lambda_function.synthesize_speech
}
moved {
  from = module.lambda.aws_lambda_function.get_jobs
  to   = module.compute.aws_lambda_function.get_jobs
}
moved {
  from = module.lambda.aws_lambda_permission.s3_invoke_start_transcription
  to   = module.compute.aws_lambda_permission.s3_invoke_start_transcription
}
moved {
  from = module.lambda.aws_s3_bucket_notification.audio_uploaded
  to   = module.compute.aws_s3_bucket_notification.audio_uploaded
}
moved {
  from = module.lambda.aws_sns_topic.alerts
  to   = module.compute.aws_sns_topic.alerts
}
moved {
  from = module.lambda.aws_sns_topic_subscription.alert_email
  to   = module.compute.aws_sns_topic_subscription.alert_email
}
moved {
  from = module.lambda.aws_cloudwatch_metric_alarm.lambda_errors
  to   = module.compute.aws_cloudwatch_metric_alarm.lambda_errors
}

# ── eventbridge -> compute ──────────────────────────────────────────────────
moved {
  from = module.eventbridge.aws_cloudwatch_event_rule.transcribe_job_state_change
  to   = module.compute.aws_cloudwatch_event_rule.transcribe_job_state_change
}
moved {
  from = module.eventbridge.aws_cloudwatch_event_target.process_transcription_result
  to   = module.compute.aws_cloudwatch_event_target.process_transcription_result
}
moved {
  from = module.eventbridge.aws_lambda_permission.eventbridge_invoke
  to   = module.compute.aws_lambda_permission.eventbridge_invoke
}

# ── api_gateway -> compute ──────────────────────────────────────────────────
moved {
  from = module.api_gateway.aws_apigatewayv2_api.main
  to   = module.compute.aws_apigatewayv2_api.main
}
moved {
  from = module.api_gateway.aws_apigatewayv2_authorizer.cognito
  to   = module.compute.aws_apigatewayv2_authorizer.cognito
}
moved {
  from = module.api_gateway.aws_apigatewayv2_stage.main
  to   = module.compute.aws_apigatewayv2_stage.main
}
moved {
  from = module.api_gateway.aws_cloudwatch_log_group.api_gateway
  to   = module.compute.aws_cloudwatch_log_group.api_gateway
}
moved {
  from = module.api_gateway.aws_apigatewayv2_integration.lambda
  to   = module.compute.aws_apigatewayv2_integration.lambda
}
moved {
  from = module.api_gateway.aws_apigatewayv2_route.route
  to   = module.compute.aws_apigatewayv2_route.route
}
moved {
  from = module.api_gateway.aws_lambda_permission.apigw_invoke
  to   = module.compute.aws_lambda_permission.apigw_invoke
}

# ── s3 (audio bucket) -> compute, random_id renamed to avoid colliding with
# frontend's own random_id.bucket_suffix once both live in the same module ──
moved {
  from = module.s3.random_id.bucket_suffix
  to   = module.compute.random_id.audio_bucket_suffix
}
moved {
  from = module.s3.aws_s3_bucket.audio
  to   = module.compute.aws_s3_bucket.audio
}
moved {
  from = module.s3.aws_s3_bucket_public_access_block.audio
  to   = module.compute.aws_s3_bucket_public_access_block.audio
}
moved {
  from = module.s3.aws_s3_bucket_server_side_encryption_configuration.audio
  to   = module.compute.aws_s3_bucket_server_side_encryption_configuration.audio
}
moved {
  from = module.s3.aws_s3_bucket_versioning.audio
  to   = module.compute.aws_s3_bucket_versioning.audio
}
moved {
  from = module.s3.aws_s3_bucket_cors_configuration.audio
  to   = module.compute.aws_s3_bucket_cors_configuration.audio
}
moved {
  from = module.s3.aws_s3_bucket_lifecycle_configuration.audio
  to   = module.compute.aws_s3_bucket_lifecycle_configuration.audio
}

# ── frontend -> compute, random_id renamed (see s3 note above) ─────────────
moved {
  from = module.frontend.random_id.bucket_suffix
  to   = module.compute.random_id.frontend_bucket_suffix
}
moved {
  from = module.frontend.aws_s3_bucket.site
  to   = module.compute.aws_s3_bucket.site
}
moved {
  from = module.frontend.aws_s3_bucket_public_access_block.site
  to   = module.compute.aws_s3_bucket_public_access_block.site
}
moved {
  from = module.frontend.aws_cloudfront_origin_access_control.site
  to   = module.compute.aws_cloudfront_origin_access_control.site
}
moved {
  from = module.frontend.aws_cloudfront_distribution.site
  to   = module.compute.aws_cloudfront_distribution.site
}
moved {
  from = module.frontend.aws_s3_bucket_policy.cloudfront_read
  to   = module.compute.aws_s3_bucket_policy.cloudfront_read
}
moved {
  from = module.frontend.aws_s3_object.index
  to   = module.compute.aws_s3_object.index
}
moved {
  from = module.frontend.aws_s3_object.app_js
  to   = module.compute.aws_s3_object.app_js
}
moved {
  from = module.frontend.aws_s3_object.styles_css
  to   = module.compute.aws_s3_object.styles_css
}
