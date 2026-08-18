# Amazon Transcribe emits a "Transcribe Job State Change" event on the default
# event bus when an async job finishes (COMPLETED or FAILED). This rule routes
# that event to the Lambda that reads the result off S3 and updates DynamoDB -
# the async counterpart to the S3-trigger used for kicking the job off.

resource "aws_cloudwatch_event_rule" "transcribe_job_state_change" {
  name        = "${var.name_prefix}-transcribe-job-state-change"
  description = "Fires when a Transcribe job completes or fails"

  event_pattern = jsonencode({
    source      = ["aws.transcribe"]
    detail-type = ["Transcribe Job State Change"]
    detail = {
      TranscriptionJobStatus = ["COMPLETED", "FAILED"]
    }
  })
}

resource "aws_cloudwatch_event_target" "process_transcription_result" {
  rule      = aws_cloudwatch_event_rule.transcribe_job_state_change.name
  target_id = "process-transcription-result"
  arn       = var.process_transcription_result_lambda_arn
}

resource "aws_lambda_permission" "eventbridge_invoke" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.process_transcription_result_lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.transcribe_job_state_change.arn
}
