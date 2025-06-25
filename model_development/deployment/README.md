
# Model Deployment

This directory contains the deployment infrastructure for deploying fraud detection models to AWS Lambda using Docker containers.

## Overview

The fraud detection models are deployed as serverless functions on AWS Lambda using custom Docker images. This approach provides:

- **Scalability**: Automatic scaling based on demand
- **Cost Efficiency**: Pay-per-request pricing model
- **Flexibility**: Custom runtime environments with Docker
- **Integration**: Seamless integration with other AWS services

## Architecture

```
Client Request → API Gateway → Lambda Function (Docker) → Model Inference → JSON Response
```

## Deployment Process

### 1. Docker Container

The models are packaged in a vanilla Docker container based on the AWS Lambda Python runtime. The container includes:

- Python 3.10 runtime
- Required ML libraries (scikit-learn, pandas, numpy)
- Boto3 for AWS integration
- Model artifacts and inference code

### 2. Lambda Function

The Lambda function receives Base64-encoded data via API Gateway and returns JSON predictions:

**Request Format:**
```json
{
  "body": "eyJtb2RlbF90eXBlIjoibmxwX2NsYXNzaWZpZXIiLCJwYXRpZW50X3V1aWQiOiIxMjM0NSIsImNkdF9jb2RlIjoiRDAwMDEiLCJhbW91bnQiOjI1MC4wMCwibm90ZXMiOiJSb3V0aW5lIGNsZWFuaW5nIHByb2NlZHVyZSIsImRhdGUiOiIyMDI0LTAxLTE1In0="
}
```

**Decoded JSON:**
```json
{
  "model_type": "nlp_classifier",
  "patient_uuid": "12345",
  "cdt_code": "D0001",
  "amount": 250.00,
  "notes": "Routine cleaning procedure",
  "date": "2024-01-15"
}
```

**Response Format:**
```json
{
  "statusCode": 200,
  "body": {
    "model_type": "nlp_classifier",
    "classification": "Not Fraudulent",
    "confidence_score": 0.75,
    "risk_level": "Low",
    "timestamp": "2024-01-15T10:30:00Z",
    "factors": [
      "Standard procedure code",
      "Reasonable amount for service",
      "Clear documentation"
    ]
  }
}
```

## API Endpoint Usage

### Example cURL Request

```bash
curl -X POST https://your-api-gateway-url/predict \
  -H "Content-Type: application/json" \
  -d '{
    "body": "eyJtb2RlbF90eXBlIjoibmxwX2NsYXNzaWZpZXIiLCJwYXRpZW50X3V1aWQiOiIxMjM0NSIsImNkdF9jb2RlIjoiRDAwMDEiLCJhbW91bnQiOjI1MC4wMCwibm90ZXMiOiJSb3V0aW5lIGNsZWFuaW5nIHByb2NlZHVyZSIsImRhdGUiOiIyMDI0LTAxLTE1In0="
  }'
```

### Python Client Example

```python
import boto3
import json
import base64

# Prepare data
data = {
    "model_type": "tabular_classifier",
    "patient_uuid": "67890",
    "cdt_code": "D0150",
    "amount": 500.00,
    "notes": "Complex dental procedure",
    "date": "2024-01-15"
}

# Encode to Base64
encoded_data = base64.b64encode(json.dumps(data).encode()).decode()

# Create Lambda client
lambda_client = boto3.client('lambda', region_name='us-east-1')

# Invoke function
response = lambda_client.invoke(
    FunctionName='fraud-detection-model',
    InvocationType='RequestResponse',
    Payload=json.dumps({"body": encoded_data})
)

# Parse response
result = json.loads(response['Payload'].read())
print(json.dumps(result, indent=2))
```

## Model Types

### 1. AWS Nova Model
- **Endpoint**: Uses AWS Bedrock integration
- **Features**: Advanced ML capabilities
- **Response Time**: ~200ms

### 2. NLP Note Classifier
- **Model**: Custom BERT-based classifier
- **Features**: Text analysis, sentiment detection
- **Response Time**: ~150ms

### 3. Tabular Classifier
- **Model**: Random Forest ensemble
- **Features**: Numerical and categorical analysis
- **Response Time**: ~100ms

## Monitoring and Logging

The deployment includes:

- **CloudWatch Logs**: Function execution logs
- **CloudWatch Metrics**: Performance monitoring
- **Slack Integration**: Real-time alerting
- **X-Ray Tracing**: Request tracing (optional)

## Security

- **IAM Roles**: Least privilege access
- **VPC Configuration**: Network isolation (optional)
- **Environment Variables**: Secure configuration
- **API Gateway**: Request throttling and authentication

## Development Workflow

1. **Local Testing**: Test models locally
2. **Docker Build**: Build container image
3. **ECR Push**: Push to Amazon ECR
4. **Lambda Deploy**: Update Lambda function
5. **API Gateway**: Configure endpoints
6. **Testing**: Validate deployment

## Cost Optimization

- **Memory Allocation**: Optimized for model size
- **Timeout Configuration**: Balanced for performance
- **Reserved Concurrency**: Prevent over-scaling
- **Dead Letter Queues**: Handle failed requests

## Contact

For deployment questions:
- Joe Webb - joe.webb@vitalityrobots.com
- AWS Account: Production deployment
- Region: us-east-1
