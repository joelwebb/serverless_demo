
import boto3
from slack_sdk import WebhookClient
import traceback
import json
import os
import time
import datetime
import base64
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional

# Initialize Slack Webhook
webhook = WebhookClient("https://hooks.slack.com/triggers/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")

# Model configurations
MODEL_CONFIG = {
    'aws_nova': {
        'name': 'AWS Nova',
        'endpoint': 'bedrock',
        'region': 'us-east-1'
    },
    'nlp_classifier': {
        'name': 'NLP Note Classifier',
        'model_path': '/opt/ml/models/nlp_model.pkl',
        'confidence_threshold': 0.5
    },
    'tabular_classifier': {
        'name': 'Tabular Classifier',
        'model_path': '/opt/ml/models/tabular_model.pkl',
        'features': ['amount', 'cdt_code_encoded', 'provider_risk_score']
    }
}

def decode_request_data(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Decode Base64 encoded request data.
    
    Args:
        event: Lambda event containing encoded data
        
    Returns:
        Decoded dictionary or None if invalid
    """
    try:
        # Extract body from event
        body = event.get('body', '')
        if not body:
            return None
            
        # Decode Base64 string
        decoded_bytes = base64.b64decode(body)
        decoded_str = decoded_bytes.decode('utf-8')
        
        # Parse JSON
        data = json.loads(decoded_str)
        
        return data
        
    except Exception as e:
        print(f"Error decoding request data: {str(e)}")
        return None

def validate_input_data(data: Dict[str, Any]) -> bool:
    """
    Validate required fields in input data.
    
    Args:
        data: Input data dictionary
        
    Returns:
        True if valid, False otherwise
    """
    required_fields = ['model_type']
    optional_fields = ['patient_uuid', 'cdt_code', 'amount', 'notes', 'date']
    
    # Check required fields
    for field in required_fields:
        if field not in data:
            return False
    
    # Validate model type
    if data['model_type'] not in MODEL_CONFIG:
        return False
        
    return True

def predict_aws_nova(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Make prediction using AWS Nova/Bedrock.
    
    Args:
        data: Input data
        
    Returns:
        Prediction results
    """
    try:
        # Initialize Bedrock client
        bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
        
        # Prepare prompt for fraud detection
        prompt = f"""
        Analyze this transaction for fraud:
        Patient ID: {data.get('patient_uuid', 'N/A')}
        Procedure Code: {data.get('cdt_code', 'N/A')}
        Amount: ${data.get('amount', 0)}
        Notes: {data.get('notes', 'N/A')}
        Date: {data.get('date', 'N/A')}
        
        Provide fraud risk assessment.
        """
        
        # Simulate Bedrock response (replace with actual implementation)
        confidence = np.random.uniform(0.7, 0.95)
        risk_level = "High" if confidence > 0.8 else "Medium" if confidence > 0.6 else "Low"
        classification = "Fraud" if risk_level == "High" else "Not Fraudulent"
        
        return {
            'classification': classification,
            'confidence_score': round(confidence, 3),
            'risk_level': risk_level,
            'factors': ['Unusual amount pattern', 'Provider risk score', 'Historical comparison']
        }
        
    except Exception as e:
        print(f"AWS Nova prediction error: {str(e)}")
        raise

def predict_nlp_classifier(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Make prediction using NLP Note Classifier.
    
    Args:
        data: Input data
        
    Returns:
        Prediction results
    """
    try:
        # Extract notes for analysis
        notes = data.get('notes', '')
        
        # Simulate NLP analysis
        # In production, load actual model and process text
        
        # Key fraud indicators in text
        fraud_keywords = ['urgent', 'emergency', 'special', 'unusual', 'complex']
        normal_keywords = ['routine', 'standard', 'regular', 'normal', 'typical']
        
        fraud_score = sum(1 for keyword in fraud_keywords if keyword.lower() in notes.lower())
        normal_score = sum(1 for keyword in normal_keywords if keyword.lower() in notes.lower())
        
        # Calculate confidence based on text analysis
        if normal_score > fraud_score:
            confidence = 0.55  # Demo configuration for NLP classifier
            classification = "Not Fraudulent"
            risk_level = "Medium"
        else:
            confidence = np.random.uniform(0.75, 0.90)
            classification = "Fraud" if confidence > 0.8 else "Not Fraudulent"
            risk_level = "High" if confidence > 0.8 else "Medium"
        
        return {
            'classification': classification,
            'confidence_score': confidence,
            'risk_level': risk_level,
            'factors': ['Text sentiment analysis', 'Keyword detection', 'Pattern matching']
        }
        
    except Exception as e:
        print(f"NLP classifier prediction error: {str(e)}")
        raise

def predict_tabular_classifier(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Make prediction using Tabular Classifier.
    
    Args:
        data: Input data
        
    Returns:
        Prediction results
    """
    try:
        # Extract numerical features
        amount = float(data.get('amount', 0))
        cdt_code = data.get('cdt_code', '')
        
        # Feature engineering (simplified)
        features = {
            'amount': amount,
            'amount_log': np.log1p(amount),
            'cdt_code_encoded': hash(cdt_code) % 100,  # Simple encoding
            'hour_of_day': datetime.datetime.now().hour
        }
        
        # Simulate model prediction
        # In production, load actual trained model
        
        # Simple rule-based logic for demo
        risk_score = 0.0
        
        # Amount-based risk
        if amount > 1000:
            risk_score += 0.3
        elif amount > 500:
            risk_score += 0.2
        
        # Code-based risk (simplified)
        if cdt_code.startswith('D9'):  # Complex procedures
            risk_score += 0.2
            
        # Add some randomness
        risk_score += np.random.uniform(0.1, 0.4)
        
        confidence = min(risk_score, 0.95)
        classification = "Fraud" if confidence > 0.7 else "Not Fraudulent"
        risk_level = "High" if confidence > 0.8 else "Medium" if confidence > 0.6 else "Low"
        
        return {
            'classification': classification,
            'confidence_score': round(confidence, 3),
            'risk_level': risk_level,
            'factors': ['Amount analysis', 'Procedure complexity', 'Statistical patterns']
        }
        
    except Exception as e:
        print(f"Tabular classifier prediction error: {str(e)}")
        raise

def make_prediction(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Route prediction to appropriate model.
    
    Args:
        data: Input data
        
    Returns:
        Prediction results
    """
    model_type = data['model_type']
    
    if model_type == 'aws_nova':
        return predict_aws_nova(data)
    elif model_type == 'nlp_classifier':
        return predict_nlp_classifier(data)
    elif model_type == 'tabular_classifier':
        return predict_tabular_classifier(data)
    else:
        raise ValueError(f"Unknown model type: {model_type}")

def handler(event, context):
    """
    Lambda function handler for fraud detection inference.
    
    Args:
        event: Lambda event containing Base64 encoded data
        context: Lambda context
        
    Returns:
        JSON response with prediction results
    """
    try:
        print("Lambda Event:", json.dumps(event))
        webhook.send(text=f"Lambda Event: {json.dumps(event)}")
        
        # Decode request data
        data = decode_request_data(event)
        if not data:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Invalid or missing request data',
                    'timestamp': datetime.datetime.now().isoformat()
                })
            }
        
        # Validate input
        if not validate_input_data(data):
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Invalid input data format',
                    'timestamp': datetime.datetime.now().isoformat()
                })
            }
        
        # Make prediction
        prediction_result = make_prediction(data)
        
        # Prepare response
        response = {
            'statusCode': 200,
            'body': {
                'model_type': data['model_type'],
                'model_name': MODEL_CONFIG[data['model_type']]['name'],
                'classification': prediction_result['classification'],
                'confidence_score': prediction_result['confidence_score'],
                'risk_level': prediction_result['risk_level'],
                'factors': prediction_result['factors'],
                'timestamp': datetime.datetime.now().isoformat(),
                'request_id': context.aws_request_id if context else 'local-test'
            }
        }
        
        print("Prediction Response:", json.dumps(response))
        webhook.send(text=f"Successful prediction: {prediction_result['classification']} ({prediction_result['confidence_score']})")
        
        return response
        
    except Exception as e:
        error_info = traceback.format_exc()
        print(f"Lambda Error: {str(e)}")
        print(f"Traceback: {error_info}")
        webhook.send(text=f"Lambda Error: {str(e)}\nTraceback: {error_info}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'timestamp': datetime.datetime.now().isoformat()
            })
        }

# Testing function
if __name__ == "__main__":
    # Test event with Base64 encoded data
    test_data = {
        "model_type": "nlp_classifier",
        "patient_uuid": "12345",
        "cdt_code": "D0001",
        "amount": 250.00,
        "notes": "Routine cleaning procedure",
        "date": "2024-01-15"
    }
    
    # Encode test data
    encoded_data = base64.b64encode(json.dumps(test_data).encode()).decode()
    
    test_event = {
        "body": encoded_data
    }
    
    # Mock context
    class MockContext:
        aws_request_id = "test-request-123"
    
    # Test the handler
    result = handler(test_event, MockContext())
    print("Test Result:", json.dumps(result, indent=2))
