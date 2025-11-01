  resource "aws_iam_openid_connect_provider" "eks_oidc" {
    url             = module.eks.cluster_oidc_issuer_url
    client_id_list  = ["sts.amazonaws.com"]
    thumbprint_list = ["9e99a48a9960b14926bb7f3b02e22da0afd10c54"] # thumbprint for https://oidc.eks.us-east-1.amazonaws.com
    depends_on = [ module.eks ]
  }

  resource "aws_iam_role" "irsa_example_role" {
    name = "${var.project_name}-${var.environment}-irsa-example-role"

    assume_role_policy = jsonencode({
      Version = "2012-10-17",
      Statement = [
        {
          Effect = "Allow",
          Principal = {
            Federated = aws_iam_openid_connect_provider.eks_oidc.arn
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

  resource "aws_iam_role_policy_attachment" "irsa_example_policy" {
    role       = aws_iam_role.irsa_example_role.name
    policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
  }
