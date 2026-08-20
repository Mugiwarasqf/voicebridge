variable "name_prefix" {
  type = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC. /16 leaves room for many /24 subnets across tiers and AZs."
  type        = string
  default     = "10.0.0.0/16"
}
