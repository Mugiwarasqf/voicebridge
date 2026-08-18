output "rule_arn" {
  value = aws_cloudwatch_event_rule.transcribe_job_state_change.arn
}
