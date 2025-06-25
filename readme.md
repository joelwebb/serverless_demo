<div id="top"></div>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="#">
    <img src="static/images/arch.png" alt="Logo">
  </a>

<h3 align="center">Fraud Detection Analytics Dashboard</h3>

  <p align="center">
    Demo application prepared for Arch Systems showcasing ML fraud detection capabilities
    <br />
    <a href="https://demo.joewebbphd.com"><strong>Live Demo Available »</strong></a>
    <br />
  </p>
</div>

<!-- TABLE OF CONTENTS -->
## Table of Contents
<details>
  <summary>Display Contents</summary>
  <hr>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#live-demo">Live Demo</a></li>
    <li><a href="#flask-application">Flask Application</a></li>
    <li><a href="#codebase-structure">Codebase Structure</a></li>
    <li><a href="#installation-and-usage">Installation</a></li>
    <li><a href="#deployment">Deployment</a></li>
    <li><a href="#model-development">Model Development</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project
This repository contains a comprehensive fraud detection analytics dashboard demo prepared specifically for Arch Systems. The application demonstrates machine learning capabilities for fraud detection, featuring data analysis, model training, inference, and monitoring capabilities.

**Key Features:**
- Interactive fraud detection dashboard
- Multiple ML model implementations (AWS Nova, NLP Classifier, Tabular Classifier)
- Real-time model inference capabilities
- Data drift monitoring and analysis
- Feature importance visualization
- Exploratory data analysis tools

## Live Demo
🌐 **Access the live demo at: [demo.joewebbphd.com](https://demo.joewebbphd.com)**

**Demo Credentials:**
- Username: `demo`
- Password: `Pa@ssW0rd123!*`

The application is deployed on AWS using serverless architecture with Zappa for seamless scalability and reliability.

## Flask Application
This is a Python Flask web application built with the following architecture:

**Backend Framework:** Flask (Python 3.11)
- **Templates:** Jinja2 templating engine
- **Styling:** Bootstrap 4 with custom CSS
- **Charts:** ApexCharts for data visualization
- **Authentication:** Session-based authentication
- **Data Processing:** CSV handling for mock fraud data

**Key Flask Routes:**
- `/dashboard` - Main analytics dashboard
- `/data` - Data management and viewing
- `/model-inference` - ML model prediction interface
- `/data-drift` - Data drift monitoring
- `/feature-importance` - Feature analysis
- `/exploratory-analysis` - EDA reports

<br />

<!-- codebase-structure -->
## ✨ Codebase Structure

The project follows a clean Flask application structure:

```bash
< PROJECT ROOT >
    |--- .github/workflows/         # CI/CD workflows
    |--- model_development/         # ML model development code
        |--- training/              # Model training scripts
        |--- evaluation/            # Model evaluation utilities
        |--- deployment/            # Model deployment code
    |--- static/                    # Static assets
        |--- assets/                # CSS, JS, fonts
        |--- images/                # Application images
        |--- data/                  # Mock data and reports
    |--- templates/                 # Jinja2 HTML templates
        |--- dashboard.html         # Main dashboard
        |--- model_inference.html   # ML inference interface
        |--- data_drift.html       # Data drift monitoring
        |--- etc.
    |--- app.py                     # Main Flask application
    |--- requirements.txt           # Python dependencies
    |--- zappa_settings.json        # AWS deployment configuration
    |--- readme.md                  # This file
```

## Installation And Usage
To run this Flask application locally:

### Prerequisites
- Python 3.11+
- pip package manager

### Setup
Create and activate a virtual environment:
```bash
pip install virtualenv
virtualenv env
source env/bin/activate  # On Windows: env\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run the Flask application:
```bash
python app.py
```

The application will be available at `http://localhost:5001`

## Deployment
The application is configured for AWS deployment using Zappa:

### AWS Deployment
```bash
# Deploy to production
zappa deploy prod

# Update existing deployment
zappa update prod

# Check deployment status
zappa status prod
```

### Environment Configuration
- **Production Domain:** demo.joewebbphd.com
- **SSL Certificate:** Configured via AWS Certificate Manager
- **Runtime:** Python 3.11
- **Architecture:** Serverless (AWS Lambda + API Gateway)

## Model Development
The `model_development/` directory contains all machine learning components:

- **Training Pipeline:** Model training and validation scripts
- **Evaluation Metrics:** Performance assessment tools
- **Deployment Scripts:** Model deployment automation

For detailed information about the ML components, see the [Model Development README](model_development/README.md).

<!-- LICENSE -->
## License
All rights reserved. Demo prepared for Arch Systems evaluation.

<!-- CONTACT -->
## Contact
Joe Webb - joe.webb@vitalityrobots.com

**Live Demo:** [demo.joewebbphd.com](https://demo.joewebbphd.com)

<p align="right">(<a href="#top">back to top</a>)</p>