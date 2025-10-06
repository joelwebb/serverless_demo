from flask import Flask, redirect, request, render_template, url_for, session, make_response, jsonify
from datetime import datetime
from functools import wraps
import uuid
import random
import json
# Read CSV data
import csv
import os
import joblib
import sklearn
import pandas as pd
import numpy as np

app = Flask(__name__)
app.secret_key = "fdaexeax233272d6b9d74dd3acb43b37a39d8f1abe17"


# --- Load models once (outside routes) ---
rf_model = joblib.load("model_development/random_forest_model.joblib")

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
        grade = request.form.get("grade", type=float)
        variety_encoded = request.form.get("variety_encoded", type=int)
        year_sold = request.form.get("year_sold", type=int)
        sale_count_per_card = request.form.get("sale_count_per_card", type=float)
        avg_price_per_card = request.form.get("avg_price_per_card", type=float)
        std_price_per_card = request.form.get("std_price_per_card", type=float)

        # === Define ALL features expected by the model ===
        feature_order = [
             'year', 'subject',  'variety', 
            'date', 'price', 'grade', 'grading_company', 'year_sold',
            'month_sold', 'day_sold', 'days_since_release', 'is_holiday_season',
             'variety_encoded', 'grading_company_encoded',
             'card_number_numeric', 'num_subjects', 'is_gold',
            'is_silver', 'is_prizm', 'is_auto', 'is_psa', 'is_bgs', 'grade_is_high',
            'grade_x_brand', 'grade_x_year', 'log_price', 'is_outlier',
            'price_tier', 'sale_count_per_card', 'avg_price_per_card',
            'std_price_per_card', 'first_sale', 'last_sale', 'trend_score',
            'days_between_sales', 'is_trending_up', 'is_trending_down'
        ]

        # === Create a single-row DataFrame with default values ===
        input_data = {col: 0 for col in feature_order}

        # --- Fill relevant numeric features with form inputs or defaults ---
        input_data.update({
            'year': 2018,
            'year_sold': year_sold or 2023,
            'month_sold': 6,
            'day_sold': 15,
            'days_since_release': 1800,
            'avg_price_per_card': avg_price_per_card or 50.0,
            'std_price_per_card': std_price_per_card or 10.0,
            'grade': grade or 9.0,
            'variety_encoded': variety_encoded or 0,
            'sale_count_per_card': sale_count_per_card or 5.0,
            'card_number_numeric': 100,
            'is_gold': 0,
            'is_auto': 0,
            'is_prizm': 0,
            'trend_score': 0.1,
            'is_trending_up': 1,
            'is_trending_down': 0,
        })

        # --- Mock non-numeric fields (these were in the training data but unused by model) ---
        input_data.update({
            'subject': 'unknown',
            'brand': 'panini prizm',
            'variety': '',
            'card_number': '000',
            'grading_company': 'psa',
            'card_id': 'mock_card_001',
            'date': '2025-01-01',
            'first_sale': '2020-01-01',
            'last_sale': '2025-01-01'
        })

        # --- Construct DataFrame in the correct column order ---
        input_df = pd.DataFrame([[input_data[col] for col in feature_order]], columns=feature_order)

        # --- Ensure datatypes are safe for numeric model inputs ---
        input_df = input_df.fillna(0)

        # --- Select model and predict ---
        if model_type == "rf":
            pred = rf_model.predict(input_df)[0]
            model_used = "Random Forest"
      
        else:
            return jsonify({"error": "Invalid model type"}), 400

        # --- Compute confidence proxy ---
        confidence = np.clip(1 - (np.std([pred]) / (abs(pred) + 1e-6)), 0.0, 1.0)

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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
