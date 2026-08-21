// Runtime config — rendered by Terraform at deploy time via templatefile().
// This file is uploaded to S3 as "config.js" and loaded by index.html.
// The VoiceBridge frontend reads window.VB_CONFIG at startup.
window.VB_CONFIG = {
  apiBaseUrl:        "${api_base_url}",
  cognitoUserPoolId: "${cognito_user_pool_id}",
  cognitoClientId:   "${cognito_client_id}",
  cognitoDomain:     "${cognito_domain}",
  awsRegion:         "${aws_region}"
};
