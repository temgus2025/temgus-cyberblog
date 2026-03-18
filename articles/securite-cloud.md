# Sécurité cloud : AWS, Azure et GCP

Le cloud a transformé l'infrastructure IT mais a aussi introduit de nouveaux vecteurs d'attaque. Les misconfigurations cloud représentent la principale cause de fuites de données en 2024. Ce guide couvre les bonnes pratiques de sécurité sur les trois grands providers.

## Les erreurs de configuration cloud les plus dangereuses

### Buckets S3 publics (AWS)

```bash
# Vérifier si un bucket S3 est public
aws s3api get-bucket-acl --bucket nom-du-bucket
aws s3api get-bucket-policy-status --bucket nom-du-bucket

# Scanner les buckets publics avec S3Scanner
python3 s3scanner.py --buckets-file entreprises.txt

# Exemples de fuites réelles causées par des S3 publics :
# Capital One (2019) : 106 millions de dossiers clients
# Twitch (2021) : code source complet
# GoDaddy : 1.2 million de credentials
```

```python
# Boto3 - Corriger la configuration des buckets
import boto3

s3 = boto3.client('s3')

# Bloquer tout accès public (recommandé par défaut)
s3.put_public_access_block(
    Bucket='mon-bucket',
    PublicAccessBlockConfiguration={
        'BlockPublicAcls': True,
        'IgnorePublicAcls': True,
        'BlockPublicPolicy': True,
        'RestrictPublicBuckets': True
    }
)

# Activer le chiffrement par défaut
s3.put_bucket_encryption(
    Bucket='mon-bucket',
    ServerSideEncryptionConfiguration={
        'Rules': [{'ApplyServerSideEncryptionByDefault': {'SSEAlgorithm': 'AES256'}}]
    }
)

# Activer la journalisation
s3.put_bucket_logging(
    Bucket='mon-bucket',
    BucketLoggingStatus={
        'LoggingEnabled': {
            'TargetBucket': 'logs-bucket',
            'TargetPrefix': 's3-access-logs/'
        }
    }
)
```

## IAM — Gestion des identités et accès

### AWS IAM

```json
// Politique IAM avec principe du moindre privilège
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::mon-bucket-app/*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "eu-west-1"
        },
        "Bool": {
          "aws:SecureTransport": "true"
        }
      }
    }
  ]
}
```

```bash
# Audit IAM avec IAM Access Analyzer
aws accessanalyzer create-analyzer --analyzer-name mon-analyser --type ACCOUNT

# Trouver les utilisateurs avec des droits excessifs
aws iam generate-credential-report
aws iam get-credential-report

# Identifier les policies overpermissives
# Chercher les "*" dans les actions ou ressources
aws iam list-policies --scope Local | jq '.Policies[].PolicyName'

# Prowler - Audit de sécurité complet AWS
pip install prowler
prowler aws --services s3 iam ec2 --region eu-west-1
```

## Sécurité réseau cloud

### VPC et security groups

```python
# Boto3 - Auditer les security groups ouverts sur Internet
import boto3

ec2 = boto3.client('ec2', region_name='eu-west-1')
sgs = ec2.describe_security_groups()['SecurityGroups']

for sg in sgs:
    for rule in sg.get('IpPermissions', []):
        for ip_range in rule.get('IpRanges', []):
            if ip_range.get('CidrIp') == '0.0.0.0/0':
                port = rule.get('FromPort', 'All')
                print(f"⚠️  SG {sg['GroupId']} ({sg['GroupName']}) - Port {port} ouvert sur Internet")
```

```yaml
# Terraform - Security Group sécurisé
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Web application security group"
  vpc_id      = aws_vpc.main.id

  # HTTPS depuis Internet
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH seulement depuis le bastion
  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
    # Jamais : cidr_blocks = ["0.0.0.0/0"]
  }

  # Sortie : tout (limiter en production)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

## Cloud Security Posture Management (CSPM)

```bash
# ScoutSuite - Audit multi-cloud
pip install scoutsuite
scout aws --report-dir ./rapport

# Checkov - IaC security (Terraform, CloudFormation)
checkov -d ./terraform --framework terraform

# CloudSploit - Détection de misconfigurations
node index.js --cloud aws --config ./config.js

# Microsoft Defender for Cloud (Azure)
# Google Security Command Center (GCP)
# AWS Security Hub (AWS)
```

## Checklist sécurité cloud

```
IAM
✅ MFA activé sur tous les comptes, obligatoire pour root/admin
✅ Pas de clés d'accès root
✅ Rotation des clés d'accès tous les 90 jours
✅ Roles IAM au lieu de clés d'accès statiques
✅ Principe du moindre privilège
✅ Utiliser AWS Organizations / Azure Management Groups

Stockage
✅ Chiffrement au repos activé sur tous les buckets/disques
✅ Pas de buckets publics
✅ Versioning activé sur les buckets critiques
✅ Logs d'accès activés

Réseau
✅ VPC avec sous-réseaux privés pour les BDD
✅ Security groups restrictifs
✅ VPN ou AWS Direct Connect pour l'accès admin
✅ CloudTrail/Azure Monitor activés (audit logs)

Monitoring
✅ AWS GuardDuty / Azure Defender activés
✅ Alertes sur connexions inhabituelles
✅ Alertes sur modifications IAM
✅ Budget alerts pour détecter le cryptomining
```

## Conclusion

La sécurité cloud repose sur le **modèle de responsabilité partagée** : le provider sécurise l'infrastructure, vous sécurisez vos données et configurations. La majorité des incidents cloud viennent de misconfigurations — utilisez des outils comme Prowler, ScoutSuite ou Checkov pour auditer régulièrement votre posture.

---
*Article suivant : [Tunneling et pivoting réseau](../articles/tunneling-pivoting)*
