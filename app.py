from flask import Flask, redirect, request, render_template, url_for, session, make_response
from datetime import datetime
from functools import wraps
import boto3
import uuid
import random
import json
# Read CSV data
import csv
import os
import joblib

app = Flask(__name__)
app.secret_key = "fdaexeax233272d6b9d74dd3acb43b37a39d8f1abe17"

# Bedrock client & model
bedrock_client = boto3.client('bedrock-runtime', region_name='us-east-1')
MODEL_ID = 'amazon.nova-micro-v1:0'

# --- Load models once (outside routes) ---
rf_model = joblib.load("model_development/random_forest_model.joblib")
xgb_model = joblib.load("model_development/xgboost_model.joblib")

@app.route('/', methods=['GET', 'POST'])
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == "demo" and password == "Pa@ssW0rd123!*":
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

    csv_path = os.path.join('static', 'data', 'mock_data.csv')
    data_rows = []
    headers = []

    try:
        with open(csv_path, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            headers = next(reader, [])  # Get headers
            # Read first 1000 rows
            for i, row in enumerate(reader):
                if i >= 100:
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

@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        # Get form inputs
        model_type = request.form.get("model_type")
        amount = request.form.get("amount", type=float)
        grade = request.form.get("grade", type=float)
        variety_encoded = request.form.get("variety_encoded", type=int)
        year_sold = request.form.get("year_sold", type=int)
        sale_count_per_card = request.form.get("sale_count_per_card", type=float)
        avg_price_per_card = request.form.get("avg_price_per_card", type=float)
        std_price_per_card = request.form.get("std_price_per_card", type=float)

        # Build feature vector (mock example)
        input_features = pd.DataFrame([{
            "avg_price_per_card": avg_price_per_card or 50,
            "std_price_per_card": std_price_per_card or 10,
            "year_sold": year_sold or 2023,
            "grade": grade or 9,
            "variety_encoded": variety_encoded or 0,
            "sale_count_per_card": sale_count_per_card or 5
        }])

        # Select model
        if model_type == "rf":
            pred = rf_model.predict(input_features)[0]
            model_used = "Random Forest"
        elif model_type == "xgb":
            pred = xgb_model.predict(input_features)[0]
            model_used = "XGBoost"
        else:
            return jsonify({"error": "Invalid model type"}), 400

        # Basic confidence proxy (could be improved)
        confidence = np.clip(1 - (np.std([pred]) / (pred + 1e-6)), 0.0, 1.0)

        return jsonify({
            "result": f"${pred:,.2f}",
            "confidence": float(confidence),
            "model_used": model_used
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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


def call_nova(prompt: str):
    """Invoke Nova Pro with a single prompt; expect a JSON array or string."""
    body = {
        "messages": [{
            "role": "user",
            "content": [{
                "text": prompt
            }]
        }],
        "inferenceConfig": {
            "max_new_tokens": 256,
            "temperature": 0.2,
            "top_p": 0.9,
            "top_k": 50
        }
    }
    resp = bedrock_client.invoke_model(modelId=MODEL_ID,
                                       contentType='application/json',
                                       accept='application/json',
                                       body=json.dumps(body))
    text = json.loads(
        resp['body'].read())["output"]["message"]["content"][0]["text"]
    # parse JSON if possible
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return text.strip()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
