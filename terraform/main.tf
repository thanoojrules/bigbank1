# Create VPC
resource "aws_vpc" "bigbank_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
}

# Create Subnet
resource "aws_subnet" "bigbank_subnet" {
  vpc_id            = aws_vpc.bigbank_vpc.id
  cidr_block        = var.subnet_cidr
  availability_zone = "us-east-2a"  # Changed to Ohio region
}

# Create Internet Gateway
resource "aws_internet_gateway" "bigbank_igw" {
  vpc_id = aws_vpc.bigbank_vpc.id
}

# Create ECS Cluster
resource "aws_ecs_cluster" "bigbank_ecs_cluster" {
  name = var.ecs_cluster_name
}

# Create ECR Repository
resource "aws_ecr_repository" "bigbank_ecr_repository" {
  name = var.ecr_repository_name
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "bigbank_ecs_task_execution_role" {
  name = "bigbank-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# Attach IAM Policy to ECS Task Execution Role
resource "aws_iam_role_policy_attachment" "bigbank_ecs_task_execution_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  role       = aws_iam_role.bigbank_ecs_task_execution_role.name
}

# IAM Role for ECS Service
resource "aws_iam_role" "bigbank_ecs_service_role" {
  name = "bigbank-ecs-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs.amazonaws.com"
        }
      }
    ]
  })
}

# Create ECS Task Definition
resource "aws_ecs_task_definition" "bigbank_node_task" {
  family                   = "bigbank-node-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.bigbank_ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.bigbank_ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "bigbank-node-container"
      image     = "${aws_ecr_repository.bigbank_ecr_repository.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
    }
  ])
}

# Create ECS Service
resource "aws_ecs_service" "bigbank_node_service" {
  name            = "bigbank-node-service"
  cluster         = aws_ecs_cluster.bigbank_ecs_cluster.id
  task_definition = aws_ecs_task_definition.bigbank_node_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.bigbank_subnet.id]
    security_groups  = [aws_security_group.bigbank_node_sg.id]
    assign_public_ip = true
  }
}

# Create Security Group for Node.js Service
resource "aws_security_group" "bigbank_node_sg" {
  name        = "bigbank-node-sg"
  description = "Allow inbound traffic"
  vpc_id      = aws_vpc.bigbank_vpc.id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
