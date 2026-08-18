output "get_upload_url_invoke_arn" {
  value = aws_lambda_function.get_upload_url.invoke_arn
}
output "get_upload_url_name" {
  value = aws_lambda_function.get_upload_url.function_name
}

output "synthesize_speech_invoke_arn" {
  value = aws_lambda_function.synthesize_speech.invoke_arn
}
output "synthesize_speech_name" {
  value = aws_lambda_function.synthesize_speech.function_name
}

output "get_jobs_invoke_arn" {
  value = aws_lambda_function.get_jobs.invoke_arn
}
output "get_jobs_name" {
  value = aws_lambda_function.get_jobs.function_name
}

output "process_transcription_result_arn" {
  value = aws_lambda_function.process_transcription_result.arn
}
output "process_transcription_result_name" {
  value = aws_lambda_function.process_transcription_result.function_name
}

output "start_transcription_name" {
  value = aws_lambda_function.start_transcription.function_name
}

output "alerts_topic_arn" {
  value = aws_sns_topic.alerts.arn
}
