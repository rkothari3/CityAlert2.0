# backend/routes/incidents.py

import datetime
from flask import Blueprint, request, jsonify
from database import db # Import the db instance from our database.py
from models import Incident, Department # Import our Incident and Department models

# Create a Blueprint for incident-related routes.
# A Blueprint helps organize a group of related views and other functions.
incidents_bp = Blueprint('incidents_bp', __name__)

# Route to create a new incident
@incidents_bp.route('/incidents', methods=['POST'])
def create_incident():
    """
    Handles the creation of a new incident report.
    Expects JSON data with 'description', 'location', 'department_classification',
    and optionally 'image_url'.
    """
    print("=== INCIDENT CREATION REQUEST RECEIVED ===")
    print(f"Request method: {request.method}")
    print(f"Request headers: {dict(request.headers)}")
    
    try:
        data = request.get_json() # Get JSON data from the request body
        print(f"Request data: {data}")

        # Validate required fields
        if not data:
            print("ERROR: No JSON data received")
            return jsonify({"error": "Request must contain JSON data"}), 400
        if not all(key in data for key in ['description', 'location', 'department_classification']):
            print("ERROR: Missing required fields")
            return jsonify({"error": "Missing required incident fields (description, location, department_classification)"}), 400

        # Check for duplicate incidents (within last hour with same details)
        # Adjust the time window as needed
        one_hour_ago = datetime.datetime.now() - datetime.timedelta(hours=1) # Adjust time window as neccesary
        
        potential_duplicate = Incident.query.filter(
            Incident.description == data['description'],
            Incident.location == data['location'],
            Incident.timestamp >= one_hour_ago
        ).first()
        
        if potential_duplicate:
            print("WARNING: Duplicate incident detected")
            return jsonify({
                "warning": "Similar incident already reported",
                "existing_incident": potential_duplicate.to_dict()
            }), 409  # 409 Conflict status code
        
        
        description = data['description']
        location = data['location']
        department_classification = data['department_classification']
        image_url = data.get('image_url') # .get() allows for optional fields

        print(f"Creating incident: {description[:50]}... at {location}")

        # Create a new Incident object
        new_incident = Incident(
            description=description,
            location=location,
            department_classification=department_classification,
            image_url=image_url
        )

        # Add the new incident to the database session and commit
        db.session.add(new_incident)
        db.session.commit()

        print(f"✓ Incident created successfully with ID: {new_incident.id}")

        # Return the newly created incident's data as JSON with a 201 Created status
        return jsonify(new_incident.to_dict()), 201

    except Exception as e:
        # Catch any unexpected errors and return a 500 Internal Server Error
        print(f"ERROR creating incident: {str(e)}")
        db.session.rollback() # Rollback the session in case of an error
        return jsonify({"error": str(e)}), 500

# Route to get all incidents
@incidents_bp.route('/incidents', methods=['GET'])
def get_all_incidents():
    """
    Retrieves all incident reports from the database.
    Can be filtered by 'status' or 'department'.
    """
    try:
        # Get query parameters for filtering
        status_filter = request.args.get('status')
        department_filter = request.args.get('department')

        query = Incident.query

        if status_filter:
            query = query.filter_by(status=status_filter)
        if department_filter:
            # Filter by department_classification containing the department_filter string
            # This allows for incidents classified under multiple departments
            query = query.filter(Incident.department_classification.like(f"%{department_filter}%"))

        incidents = query.all() # Fetch all incidents matching the query

        # Convert list of Incident objects to list of dictionaries
        incidents_data = [incident.to_dict() for incident in incidents]

        return jsonify(incidents_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to get a single incident by ID
@incidents_bp.route('/incidents/<int:incident_id>', methods=['GET'])
def get_incident(incident_id):
    """
    Retrieves a single incident report by its ID.
    """
    try:
        # Query the database for an incident with the given ID
        incident = Incident.query.get(incident_id)

        if incident:
            return jsonify(incident.to_dict()), 200
        else:
            return jsonify({"message": "Incident not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to update an existing incident
@incidents_bp.route('/incidents/<int:incident_id>', methods=['PUT'])
def update_incident(incident_id):
    """
    Updates an existing incident report by its ID.
    Expects JSON data with fields to update (e.g., 'status', 'description').
    """
    try:
        incident = Incident.query.get(incident_id) # Find the incident by ID

        if not incident:
            return jsonify({"message": "Incident not found"}), 404

        data = request.get_json() # Get JSON data from the request body

        if not data:
            return jsonify({"error": "Request must contain JSON data"}), 400

        # Update fields if they are present in the request data
        if 'description' in data:
            incident.description = data['description']
        if 'location' in data:
            incident.location = data['location']
        if 'image_url' in data:
            incident.image_url = data['image_url']
        if 'department_classification' in data:
            incident.department_classification = data['department_classification']
        if 'status' in data:
            incident.status = data['status']

        db.session.commit() # Commit the changes to the database

        return jsonify(incident.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Route to delete an incident
@incidents_bp.route('/incidents/<int:incident_id>', methods=['DELETE'])
def delete_incident(incident_id):
    """
    Deletes an incident report by its ID.
    """
    try:
        incident = Incident.query.get(incident_id) # Find the incident by ID

        if not incident:
            return jsonify({"message": "Incident not found"}), 404

        db.session.delete(incident) # Delete the incident from the session
        db.session.commit() # Commit the deletion

        return jsonify({"message": "Incident deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

