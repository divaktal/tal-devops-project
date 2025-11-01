# AWS Configuration
aws_region = "us-east-1"
project_name = "lily-designer-studio"
environment = "dev"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"

# EKS Configuration
eks_cluster_version = "1.32"
eks_instance_types = ["t3.medium", "t3a.medium"]
eks_desired_size = 2
eks_min_size = 1
eks_max_size = 3

# Infrastructure Options
enable_nat_gateway = true
single_nat_gateway = true
