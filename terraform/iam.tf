resource "aws_iam_role" "irsa_example_role" {
  name = "${var.project_name}-${var.environment}-irsa-example-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Federated = module.eks.oidc_provider_arn
        },
        Action = "sts:AssumeRoleWithWebIdentity",
        Condition = {
          StringEquals = {
            "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:sub" = "system:serviceaccount:lily-studio:example-serviceaccount"
          }
        }
      }
    ]
  })
}