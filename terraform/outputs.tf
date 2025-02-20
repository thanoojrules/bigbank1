output "vpc_id" {
  value = aws_vpc.bigbank_vpc.id
}

output "subnet_id" {
  value = aws_subnet.bigbank_subnet.id
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.bigbank_ecs_cluster.name
}

output "ecr_repository_url" {
  value = aws_ecr_repository.bigbank_ecr_repository.repository_url
}
