
import unittest
import json
from unittest.mock import patch, mock_open
import sys
import os

# Add the parent directory to the path to import the app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app


class TestFlaskApp(unittest.TestCase):
    def setUp(self):
        """Set up test client and test configuration."""
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['SECRET_KEY'] = 'test-secret-key'
        self.client = self.app.test_client()

    def test_login_page_get(self):
        """Test that login page loads correctly."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'login', response.data.lower())

    def test_login_success(self):
        """Test successful login with correct credentials."""
        response = self.client.post('/login', data={
            'username': 'demo',
            'password': 'Pa@ssW0rd123!*'
        }, follow_redirects=False)
        self.assertEqual(response.status_code, 302)
        self.assertIn('/dashboard', response.location)

    def test_login_failure(self):
        """Test login failure with incorrect credentials."""
        response = self.client.post('/login', data={
            'username': 'wrong',
            'password': 'wrong'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'login', response.data.lower())

    def test_dashboard_without_login(self):
        """Test that dashboard redirects to login when not authenticated."""
        response = self.client.get('/dashboard', follow_redirects=False)
        self.assertEqual(response.status_code, 302)
        self.assertIn('/login', response.location)

    def test_dashboard_with_login(self):
        """Test dashboard access after login."""
        with self.client.session_transaction() as sess:
            sess['username'] = 'demo'
        
        response = self.client.get('/dashboard')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Demo prepared for Arch Systems', response.data)

    def test_data_page_with_login(self):
        """Test data page access after login."""
        with self.client.session_transaction() as sess:
            sess['username'] = 'demo'
        
        with patch('builtins.open', mock_open(read_data='header1,header2\nvalue1,value2')):
            response = self.client.get('/data')
            self.assertEqual(response.status_code, 200)

    def test_model_inference_page(self):
        """Test model inference page access."""
        with self.client.session_transaction() as sess:
            sess['username'] = 'demo'
        
        response = self.client.get('/model-inference')
        self.assertEqual(response.status_code, 200)

    def test_predict_api_nlp_classifier(self):
        """Test prediction API with NLP classifier."""
        with self.client.session_transaction() as sess:
            sess['username'] = 'demo'
        
        response = self.client.post('/api/predict', data={
            'model_type': 'nlp_classifier',
            'patient_uuid': 'test-uuid',
            'cdt_code': 'D1234',
            'amount': '100',
            'notes': 'test notes',
            'date': '2024-01-01'
        })
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['result'], 'Medium Risk')
        self.assertEqual(data['confidence'], 0.55)
        self.assertEqual(data['model_used'], 'NLP Note Classifier')

    def test_predict_api_other_models(self):
        """Test prediction API with other model types."""
        with self.client.session_transaction() as sess:
            sess['username'] = 'demo'
        
        response = self.client.post('/api/predict', data={
            'model_type': 'tabular_classifier',
            'patient_uuid': 'test-uuid',
            'cdt_code': 'D1234',
            'amount': '100',
            'notes': 'test notes',
            'date': '2024-01-01'
        })
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn(data['result'], ['High Risk', 'Low Risk'])
        self.assertGreaterEqual(data['confidence'], 0.7)
        self.assertLessEqual(data['confidence'], 0.95)

    def test_predict_api_without_auth(self):
        """Test prediction API without authentication."""
        response = self.client.post('/api/predict', data={
            'model_type': 'nlp_classifier'
        })
        
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertEqual(data['error'], 'Not authenticated')

    def test_predict_api_missing_model_type(self):
        """Test prediction API with missing model type."""
        with self.client.session_transaction() as sess:
            sess['username'] = 'demo'
        
        response = self.client.post('/api/predict', data={})
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertEqual(data['error'], 'Model type is required')

    def test_trigger_retraining_api(self):
        """Test model retraining trigger API."""
        with self.client.session_transaction() as sess:
            sess['username'] = 'demo'
        
        response = self.client.post('/api/trigger-retraining')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'Retraining job started')
        self.assertEqual(data['job_id'], '12345')

    def test_logout(self):
        """Test logout functionality."""
        with self.client.session_transaction() as sess:
            sess['username'] = 'demo'
        
        response = self.client.get('/logout', follow_redirects=False)
        self.assertEqual(response.status_code, 302)
        self.assertIn('/login', response.location)

    def test_data_drift_page(self):
        """Test data drift page access."""
        with self.client.session_transaction() as sess:
            sess['username'] = 'demo'
        
        response = self.client.get('/data-drift')
        self.assertEqual(response.status_code, 200)

    def test_exploratory_analysis_page(self):
        """Test exploratory analysis page access."""
        with self.client.session_transaction() as sess:
            sess['username'] = 'demo'
        
        response = self.client.get('/exploratory-analysis')
        self.assertEqual(response.status_code, 200)

    def test_model_training_page(self):
        """Test model training page access."""
        with self.client.session_transaction() as sess:
            sess['username'] = 'demo'
        
        response = self.client.get('/model-training')
        self.assertEqual(response.status_code, 200)

    def test_feature_importance_page(self):
        """Test feature importance page access."""
        with self.client.session_transaction() as sess:
            sess['username'] = 'demo'
        
        response = self.client.get('/feature-importance')
        self.assertEqual(response.status_code, 200)


if __name__ == '__main__':
    unittest.main()
