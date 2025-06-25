from flask import Flask, redirect, request, render_template, url_for, session, make_response
from datetime import datetime
from functools import wraps
import uuid
import random

app = Flask(__name__)
app.secret_key = "fdaexeax233272d6b9d74dd3acb43b37a39d8f1abe17"


@app.route('/', methods=['GET', 'POST'])
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == "demo" and password == "demo":
            session['username'] = username
            return redirect('/dashboard')
    return render_template('login.html')


@app.route('/dashboard')
def dashboard():
    if 'username' not in session:
        return redirect('/login')
    return render_template('dashboard.html',
                           username=session['username'],
                           active_page='dashboard')


@app.route('/profile')
def profile():
    if 'username' not in session:
        return redirect('/login')
    return render_template('profile.html',
                           username=session['username'],
                           active_page='profile')


@app.route('/settings')
def settings():
    """Render the game settings page.

    Returns:
        str: Rendered HTML template for game settings.
    """
    return render_template("settings.html",
                           active_page='Settings',
                           request=request)


@app.route('/data')
def data():
    """Render the data page with table and download functionality."""
    if 'username' not in session:
        return redirect('/login')

    # Read CSV data
    import csv
    import os

    csv_path = os.path.join('static', 'data', 'mock_data.csv')
    data_rows = []
    headers = []

    try:
        with open(csv_path, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            headers = next(reader, [])  # Get headers
            # Read first 1000 rows
            for i, row in enumerate(reader):
                if i >= 1000:
                    break
                data_rows.append(row)
    except FileNotFoundError:
        # If file doesn't exist, use empty data
        headers = ['Patient UUID', 'CDT Code', 'Amount', 'Date', 'Notes']
        data_rows = []

    return render_template("data.html",
                           username=session['username'],
                           active_page='data',
                           headers=headers,
                           data_rows=data_rows)


@app.route('/exploratory-analysis')
def exploratory_analysis():
    """Render the exploratory data analysis page."""
    if 'username' not in session:
        return redirect('/login')
    return render_template("exploratory_analysis.html",
                           username=session['username'],
                           active_page='exploratory_analysis')


@app.route('/data-drift')
def data_drift():
    """Render the data drift report page."""
    if 'username' not in session:
        return redirect('/login')
    return render_template("data_drift.html",
                           username=session['username'],
                           active_page='data_drift')


@app.route('/model-training')
def model_training():
    """Render the model training page with metrics table."""
    if 'username' not in session:
        return redirect('/login')
    return render_template("model_training.html",
                           username=session['username'],
                           active_page='model_training')


@app.route('/model-inference')
def model_inference():
    """Render the model inference page with prediction form."""
    if 'username' not in session:
        return redirect('/login')
    return render_template("model_inference.html",
                           username=session['username'],
                           active_page='model_inference')


@app.route('/feature-importance')
def feature_importance():
    """Render the feature importance page with charts."""
    if 'username' not in session:
        return redirect('/login')
    return render_template("feature_importance.html",
                           username=session['username'],
                           active_page='feature_importance')


@app.route('/api/predict', methods=['POST'])
def predict():
    """Handle model inference API call."""
    if 'username' not in session:
        return {'error': 'Not authenticated'}, 401

    # Get form data
    model_type = request.form.get('model_type', '')
    patient_uuid = request.form.get('patient_uuid', '')
    cdt_code = request.form.get('cdt_code', '')
    amount = request.form.get('amount', '')
    notes = request.form.get('notes', '')
    date = request.form.get('date', '')

    if not model_type:
        return {'error': 'Model type is required'}, 400

    # Simulate prediction based on model type (replace with actual ML model)
    model_names = {
        'aws_nova': 'AWS Nova',
        'nlp_classifier': 'NLP Note Classifier', 
        'tabular_classifier': 'Tabular Classifier'
    }
    
    prediction = {
        'result': 'High Risk' if random.random() > 0.5 else 'Low Risk',
        'confidence': round(random.uniform(0.7, 0.95), 3),
        'factors': ['Factor A', 'Factor B', 'Factor C'],
        'model_used': model_names.get(model_type, 'Unknown Model')
    }

    return prediction


@app.route('/api/trigger-retraining', methods=['POST'])
def trigger_retraining():
    """Handle model retraining trigger."""
    if 'username' not in session:
        return {'error': 'Not authenticated'}, 401

    # Simulate retraining trigger
    return {'status': 'Retraining job started', 'job_id': '12345'}


@app.route('/logout')
def logout():
    """Handle logout and redirect to login page.

    Returns:
        Redirect to login page
    """
    session.clear()
    return redirect(url_for('login'))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
