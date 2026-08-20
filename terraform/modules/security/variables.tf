variable "name_prefix" {
  type = string
}

variable "cognito_domain_prefix" {
  type = string
}

variable "oauth_callback_urls" {
  description = "URLs Cognito Hosted UI is allowed to redirect back to after login/logout."
  type        = list(string)
  default     = ["http://localhost:5173"]
}
