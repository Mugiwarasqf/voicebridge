# VPC scaffolding for future workloads that need real networking (RDS,
# ElastiCache, ECS/Fargate). Nothing in this stack is attached to it yet --
# Lambda uses AWS's own managed networking and talks to S3/DynamoDB/Cognito/
# Transcribe/Polly over the public AWS API endpoints, so there's no NAT
# gateway or VPC endpoint here (both cost money). Adding a NAT gateway later
# is a single aws_route on the already-existing private route table below --
# no subnet re-association needed.

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  # Deliberate gaps between tiers (public .0-.1, private .10-.11, isolated
  # .20-.21) so a 3rd AZ or a bigger tier can be added later without
  # renumbering anything that already exists.
  public_subnet_cidrs   = ["10.0.0.0/24", "10.0.1.0/24"]
  private_subnet_cidrs  = ["10.0.10.0/24", "10.0.11.0/24"]
  isolated_subnet_cidrs = ["10.0.20.0/24", "10.0.21.0/24"]

  az_indexes = { for idx, az in local.azs : az => idx }
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.name_prefix}-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.name_prefix}-igw"
  }
}

resource "aws_subnet" "public" {
  for_each = local.az_indexes

  vpc_id                  = aws_vpc.main.id
  availability_zone       = each.key
  cidr_block              = local.public_subnet_cidrs[each.value]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.name_prefix}-public-${each.key}"
    Tier = "public"
  }
}

resource "aws_subnet" "private" {
  for_each = local.az_indexes

  vpc_id            = aws_vpc.main.id
  availability_zone = each.key
  cidr_block        = local.private_subnet_cidrs[each.value]

  tags = {
    Name = "${var.name_prefix}-private-${each.key}"
    Tier = "private"
  }
}

resource "aws_subnet" "isolated" {
  for_each = local.az_indexes

  vpc_id            = aws_vpc.main.id
  availability_zone = each.key
  cidr_block        = local.isolated_subnet_cidrs[each.value]

  tags = {
    Name = "${var.name_prefix}-isolated-${each.key}"
    Tier = "isolated"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.name_prefix}-public-rt"
  }
}

# No routes yet -- attaching a NAT gateway later means adding one aws_route
# here, not re-associating subnets or touching anything already running in
# them.
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.name_prefix}-private-rt"
  }
}

# Deliberately its own table, not shared with private, so a future "give
# private subnets internet access" change can never accidentally leak
# outbound routing to the database tier.
resource "aws_route_table" "isolated" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.name_prefix}-isolated-rt"
  }
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "isolated" {
  for_each = aws_subnet.isolated

  subnet_id      = each.value.id
  route_table_id = aws_route_table.isolated.id
}
