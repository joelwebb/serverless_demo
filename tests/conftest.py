
import pytest
import sys
import os

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

@pytest.fixture
def app():
    """Create and configure a test Flask app."""
    from app import app
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key'
    return app

@pytest.fixture
def client(app):
    """Create a test client for the Flask app."""
    return app.test_client()

@pytest.fixture
def authenticated_client(client):
    """Create an authenticated test client."""
    with client.session_transaction() as sess:
        sess['username'] = 'demo'
    return client

@pytest.fixture
def sample_fraud_data():
    """Provide sample fraud detection data."""
    import pandas as pd
    return pd.DataFrame({
        'provider_id': ['P001', 'P002', 'P003', 'P004', 'P005'],
        'cpt_code': ['99213', '99214', '99215', '99213', '99214'],
        'service_date': ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'],
        'amount': [100.0, 150.0, 200.0, 95.0, 160.0],
        'fraud_label': [0, 1, 0, 1, 0],
        'whistleblower_notes': ['Normal claim', 'Suspicious pattern', 'Standard visit', 'Overcharging', 'Regular check']
    })
