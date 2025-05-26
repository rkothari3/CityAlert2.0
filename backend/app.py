# backend/app.py

# Import necessary modules from Flask and Flask-SQLAlchemy, and Flask-CORS
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from datetime import datetime # Import datetime for timestamp in Incident model

# Import the configuration settings from config.py
from config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS, SECRET_KEY

# Import the database models we just defined
from database import db

from models import Department, Incident

# Import the incidents Blueprint
from routes.incidents import incidents_bp
# Import the departments Blueprint
from routes.departments import departments_bp

# Chat backend
from routes.chat import chat_bp

# Initialize the Flask application
app = Flask(__name__)

# Load configuration from config.py
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = SQLALCHEMY_TRACK_MODIFICATIONS
app.config['SECRET_KEY'] = SECRET_KEY

# Initialize the SQLAlchemy database instance
db.init_app(app) # Use db.init_app(app) instead of SQLAlchemy(app) when db is imported from models

# Initialize Flask-CORS with more permissive settings for development
CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500", "http://127.0.0.1:3000", "http://localhost:3000"])

# Add a before_request handler to log all incoming requests
@app.before_request
def log_request_info():
    print(f"\n=== INCOMING REQUEST ===")
    print(f"Method: {request.method}")
    print(f"URL: {request.url}")
    print(f"Headers: {dict(request.headers)}")
    if request.is_json:
        print(f"JSON Data: {request.get_json()}")
    print("========================\n")


# Register the incidents Blueprint with a URL prefix
app.register_blueprint(incidents_bp, url_prefix='/api')

# Same for departments
app.register_blueprint(departments_bp, url_prefix='/api')

# Chat
app.register_blueprint(chat_bp, url_prefix='/api')

# Function to initialize default departments
def create_default_departments():
    """
    Checks if default departments exist in the database and creates them if not.
    This ensures that the system has the necessary departments for incident classification.
    """
    # List of default departments and their simple login keys
    default_departments = [
        {"name": "POLICE", "login_key": "policekey"},
        {"name": "FIRE", "login_key": "firekey"},
        {"name": "MEDICAL", "login_key": "medicalkey"},
        {"name": "PUBLIC_WORKS", "login_key": "publicworkskey"},
        {"name": "ENVIRONMENT", "login_key": "environmentkey"},
        {"name": "ANIMAL_CONTROL", "login_key": "animalkey"},
        {"name": "BUILDING_SAFETY", "login_key": "buildingsafetykey"},
        {"name": "TRANSPORTATION", "login_key": "transportationkey"},
        {"name": "PARKS_RECREATION", "login_key": "parkskey"},
        {"name": "UTILITIES", "login_key": "utilitieskey"},
        {"name": "GENERAL", "login_key": "generalkey"} # Add GENERAL department
    ]

    print("Checking for default departments...")
    for dept_data in default_departments:
        # Query the database to see if a department with this name already exists
        department = Department.query.filter_by(name=dept_data["name"]).first()
        if not department:
            # If the department does not exist, create a new Department object
            new_department = Department(name=dept_data["name"], login_key=dept_data["login_key"])
            # Add the new department to the session
            db.session.add(new_department)
            print(f"Added department: {dept_data['name']}")
    # Commit the changes to the database
    db.session.commit()
    print("Default department check complete.")


# Define a simple root route to check if the backend is running
@app.route('/')
def home():
    """
    A simple home route that returns a JSON message.
    This is useful for quickly checking if the Flask application is up and running.
    """
    return jsonify({"message": "CityAlert Backend is running!"})



# This block ensures that the Flask development server runs only when the script
# is executed directly (e.g., `python app.py`), not when imported as a module.
if __name__ == '__main__':
    with app.app_context():
        # Create the database tables if they don't already exist.
        db.create_all()
        # After creating tables, populate with default departments
        create_default_departments()
    # Run the Flask application in debug mode with specific host and port
    print("Starting CityAlert Backend Server...")
    print("Server will be available at: http://127.0.0.1:5000")
    print("API endpoints available at: http://127.0.0.1:5000/api/")
    app.run(debug=True, host='127.0.0.1', port=5000)

