# backend/routes/departments.py

from flask import Blueprint, request, jsonify
from database import db # Import the db instance
from models import Department, Incident # Import our Department and Incident models

# Create a Blueprint for department-related routes
departments_bp = Blueprint('departments_bp', __name__)

# Route for department login
@departments_bp.route('/departments/login', methods=['POST'])
def department_login():
    """
    Handles department login.
    Expects JSON data with 'login_key'.
    Returns department details if login is successful.
    """
    try:
        data = request.get_json()
        if not data or 'login_key' not in data:
            return jsonify({"error": "Missing 'login_key' in request"}), 400

        login_key = data['login_key']

        # Find the department by the provided login key
        department = Department.query.filter_by(login_key=login_key).first()

        if department:
            # If department found, return its details (excluding the login_key for security)
            # In a real app, you'd generate a JWT token here for session management
            return jsonify(department.to_dict()), 200
        else:
            return jsonify({"message": "Invalid login key"}), 401 # 401 Unauthorized

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to get incidents specific to a department
@departments_bp.route('/departments/<string:department_name>/incidents', methods=['GET'])
def get_department_incidents(department_name):
    """
    Retrieves incidents classified for a specific department.
    The department_name should match one of the names in the DEPARTMENT_CLASSIFICATION_GUIDE.
    Can also filter by 'status' query parameter.
    """
    try:
        # Normalize department name to uppercase for consistency with classification
        department_name_upper = department_name.upper()

        # Get optional status filter from query parameters
        status_filter = request.args.get('status')

        # Query incidents where department_classification contains the department_name
        # This handles cases where an incident is classified for multiple departments (e.g., "POLICE,MEDICAL")
        query = Incident.query.filter(Incident.department_classification.like(f"%{department_name_upper}%"))

        if status_filter:
            query = query.filter_by(status=status_filter)

        # Order by timestamp descending (newest first)
        query = query.order_by(Incident.timestamp.desc())

        incidents = query.all()

        # Convert list of Incident objects to list of dictionaries
        incidents_data = [incident.to_dict() for incident in incidents]

        return jsonify(incidents_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to get all departments (for potential admin use or dropdowns)
@departments_bp.route('/departments', methods=['GET'])
def get_all_departments():
    """
    Retrieves a list of all registered departments.
    """
    try:
        departments = Department.query.all()
        departments_data = [dept.to_dict() for dept in departments]
        return jsonify(departments_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

