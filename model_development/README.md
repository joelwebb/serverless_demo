
# Model Development

This directory contains the machine learning components for the fraud detection system demonstrated in the Arch Systems analytics dashboard.

## Overview

The fraud detection system implements multiple machine learning approaches to identify potentially fraudulent transactions and activities. This modular architecture allows for easy comparison and deployment of different model types.

## Directory Structure

```bash
model_development/
├── training/           # Model training scripts and pipelines
├── evaluation/         # Model evaluation and metrics
├── deployment/         # Model deployment and serving code
└── README.md          # This file
```

## Model Types

### 1. AWS Nova Model
- **Type:** Cloud-based ML service integration
- **Use Case:** Leverages AWS's pre-trained fraud detection capabilities
- **Features:** Real-time inference, managed scaling

### 2. NLP Note Classifier
- **Type:** Natural Language Processing model
- **Use Case:** Analyzes text notes and descriptions for fraud indicators
- **Features:** Text preprocessing, sentiment analysis, pattern recognition
- **Demo Configuration:** Returns "Medium Risk" with 55% confidence

### 3. Tabular Classifier
- **Type:** Traditional machine learning on structured data
- **Use Case:** Processes numerical and categorical features
- **Features:** Feature engineering, ensemble methods, interpretability

## Training Pipeline

The training pipeline supports:
- Data preprocessing and feature engineering
- Model training with cross-validation
- Hyperparameter optimization
- Model versioning and artifact storage

## Evaluation Metrics

Models are evaluated using:
- **Precision/Recall:** For fraud detection accuracy
- **F1-Score:** Balanced performance measure
- **AUC-ROC:** Classification performance across thresholds
- **Feature Importance:** Model interpretability

## Deployment

Models are deployed through:
- **API Endpoints:** RESTful inference services
- **Batch Processing:** Large-scale data processing
- **Real-time Inference:** Low-latency prediction serving

## Integration with Dashboard

The models integrate with the main Flask application through:
- `/api/predict` endpoint for real-time predictions
- Model selection interface in the web UI
- Performance monitoring and drift detection

## Development Workflow

1. **Data Preparation:** Process and validate training data
2. **Model Training:** Train and validate models
3. **Evaluation:** Assess model performance
4. **Deployment:** Deploy models to production
5. **Monitoring:** Track model performance over time

## Getting Started

To work with the model development components:

```bash
# Navigate to model development directory
cd model_development/

# Set up Python environment (if not already done)
pip install -r ../requirements.txt

# Run training pipeline
python training/train_models.py

# Evaluate models
python evaluation/evaluate_models.py

# Deploy models
python deployment/deploy_models.py
```

## Demo Configuration

For the Arch Systems demo, models are configured with:
- **Mock predictions:** Simulated fraud detection results
- **Realistic confidence scores:** Between 70-95% for most predictions
- **Special NLP case:** 55% confidence, "Medium Risk" classification

## Contact

For questions about the model development components:
- Joe Webb - joe.webb@vitalityrobots.com
- Live Demo: [demo.joewebbphd.com](https://demo.joewebbphd.com)
