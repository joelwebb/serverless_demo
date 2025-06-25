from flask import Flask, redirect, request, render_template, url_for, session, make_response
from datetime import datetime
from functools import wraps
import uuid

app = Flask(__name__)
app.secret_key = "fdaexeax233272d6b9d74dd3acb43b37a39d8f1abe17"


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == "demo" and password == "Pa$$w@rd123*9!":
            session['username'] = username
            return redirect('/dashboard')
    return render_template('login.html')


@app.route('/home')
def home():
    if 'username' not in session:
        return redirect('/login')
    return render_template('home.html', username=session['username'])


@app.route('/dashboard')
def dashboard():
    if 'username' not in session:
        return redirect('/login')
    return render_template('dashboard.html', 
                         username=session['username'],
                         active_page='dashboard')

@app.route('/')
def index():
    return redirect('/login')



@app.route('/settings')
def settings():
    """Render the game settings page.

    Returns:
        str: Rendered HTML template for game settings.
    """
    return render_template("settings.html",
                           active_page='Settings',
                           request=request)

@app.route('/logout')
def logout():
    """Handle logout and redirect to login page.

    Returns:
        Redirect to login page
    """
    session.clear()
    return redirect(url_for('login'))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
