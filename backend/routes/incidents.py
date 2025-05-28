# backend/routes/incidents.py

import datetime
import base64
import os
from flask import Blueprint, request, jsonify, send_from_directory
from database import db # Import the db instance from our database.py
from models import Incident, Department # Import our Incident and Department models
from utils.geocoding import geocode_address # Import our new geocoding function
from uuid import uuid4

# Create a Blueprint for incident-related routes.
# A Blueprint helps organize a group of related views and other functions.
incidents_bp = Blueprint('incidents_bp', __name__)

# Route to create a new incident
@incidents_bp.route('/incidents', methods=['POST'])
def create_incident():
    """
    Handles the creation of a new incident report.
    Expects JSON data with 'description', 'location', 'department_classification',
    and optionally 'image_url' (can be base64 data or URL).
    Now also geocodes the location and handles image storage.
    """
    print("=== INCIDENT CREATION REQUEST RECEIVED ===")
    print(f"Request method: {request.method}")
    
    try:
        data = request.get_json()
        print(f"Request data keys: {list(data.keys()) if data else 'None'}")

        # Validate required fields
        if not data:
            print("ERROR: No JSON data received")
            return jsonify({"error": "Request must contain JSON data"}), 400
        if not all(key in data for key in ['description', 'location', 'department_classification']):
            print("ERROR: Missing required fields")
            return jsonify({"error": "Missing required incident fields (description, location, department_classification)"}), 400

        # Check for duplicate incidents (within last hour with same details)
        # Enhanced duplicate detection with more detailed response
        one_hour_ago = datetime.datetime.now() - datetime.timedelta(hours=1)
        
        # Check for exact duplicates first
        exact_duplicate = Incident.query.filter(
            Incident.description == data['description'],
            Incident.location == data['location'],
            Incident.timestamp >= one_hour_ago
        ).first()
        
        # If no exact duplicate, check for similar incidents in the same location
        if not exact_duplicate:
            similar_incidents = Incident.query.filter(
                Incident.location == data['location'],
                Incident.department_classification == data['department_classification'],
                Incident.timestamp >= one_hour_ago,
                Incident.status.in_(['reported', 'in_progress'])  # Only active incidents
            ).all()
            
            if similar_incidents:
                # Return the most recent similar incident
                most_recent = max(similar_incidents, key=lambda x: x.timestamp)
                print(f"WARNING: Similar incident detected at same location")
                return jsonify({
                    "warning": "Similar incident already reported at this location",
                    "existing_incident": most_recent.to_dict(),
                    "message": f"A {most_recent.department_classification.lower()} incident was reported at this location {format_time_ago(most_recent.timestamp)}. Please check the Alerts page to see if this is the same incident.",
                    "alerts_page_url": "/alerts.html"
                }), 409
        
        if exact_duplicate:
            print("WARNING: Exact duplicate incident detected")
            return jsonify({
                "warning": "Duplicate incident already reported",
                "existing_incident": exact_duplicate.to_dict(),
                "message": f"This exact incident was already reported {format_time_ago(exact_duplicate.timestamp)}. Please check the Alerts page for updates.",
                "alerts_page_url": "/alerts.html"
            }), 409
        
        description = data['description']
        location = data['location']
        department_classification = data['department_classification']
        image_data = data.get('image_url')

        print(f"Creating incident: {description[:50]}... at {location}")

        # Handle image storage
        stored_image_path = None
        if image_data:
            if image_data.startswith('data:image/'):
                # This is base64 image data
                try:
                    # Create uploads directory if it doesn't exist
                    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
                    os.makedirs(uploads_dir, exist_ok=True)
                    
                    # Extract base64 data and decode
                    header, encoded = image_data.split(',', 1)
                    image_bytes = base64.b64decode(encoded)
                    
                    # Generate unique filename
                    file_extension = 'png' if 'png' in header else 'jpg'
                    filename = f"incident_{uuid4()}.{file_extension}"
                    file_path = os.path.join(uploads_dir, filename)
                    
                    # Save image file
                    with open(file_path, 'wb') as f:
                        f.write(image_bytes)
                    
                    stored_image_path = f"/uploads/{filename}"
                    print(f"✓ Image saved as: {stored_image_path}")
                    
                except Exception as e:
                    print(f"⚠ Error saving image: {e}")
                    # Continue without image if saving fails
            else:
                # This is already a URL
                stored_image_path = image_data

        # NEW: Geocode the location to get latitude and longitude
        print("Attempting to geocode the location...")
        latitude, longitude = geocode_address(location)
        
        if latitude is not None and longitude is not None:
            print(f"✓ Successfully geocoded location to ({latitude}, {longitude})")
        else:
            print("⚠ Geocoding failed, but continuing with incident creation")

        # Create a new Incident object with the stored image path
        new_incident = Incident(
            description=description,
            location=location,
            latitude=latitude,  # Will be None if geocoding failed
            longitude=longitude,  # Will be None if geocoding failed
            department_classification=department_classification,
            image_url=stored_image_path
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
    If location is updated, it will also re-geocode the new location.
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
            # If location is being updated, re-geocode it
            new_location = data['location']
            incident.location = new_location
            print(f"Location updated, re-geocoding: {new_location}")
            latitude, longitude = geocode_address(new_location)
            incident.latitude = latitude
            incident.longitude = longitude
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
    Requires department authentication via department_key and department_name in request body.
    """
    try:
        incident = Incident.query.get(incident_id) # Find the incident by ID

        if not incident:
            return jsonify({"error": "Incident not found"}), 404

        # Check if request has JSON data for department authentication
        data = request.get_json()
        if data and 'department_key' in data and 'department_name' in data:
            # Validate department credentials
            department = Department.query.filter_by(
                name=data['department_name'].upper(),
                login_key=data['department_key']
            ).first()
            
            if not department:
                return jsonify({"error": "Invalid department credentials"}), 401
            
            # Check if department is authorized to delete this incident
            if data['department_name'].upper() not in incident.department_classification:
                return jsonify({"error": "Department not authorized to delete this incident"}), 403

        db.session.delete(incident) # Delete the incident from the session
        db.session.commit() # Commit the deletion

        print(f"✓ Incident {incident_id} deleted successfully")
        return jsonify({"message": "Incident deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"ERROR deleting incident {incident_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Route to delete all incidents
@incidents_bp.route('/incidents/clear-all', methods=['DELETE'])
def clear_all_incidents():
    """
    Deletes ALL incident reports from the database.
    This is a destructive operation and should be used with caution.
    """
    try:
        # Count incidents before deletion
        count = Incident.query.count()
        
        # Delete all incidents
        Incident.query.delete()
        db.session.commit()
        
        print(f"✓ Successfully deleted all {count} incidents")
        return jsonify({
            "message": f"All incidents deleted successfully ({count} total)",
            "count": count
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"ERROR clearing incidents: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Add a new route to serve uploaded images
@incidents_bp.route('/uploads/<filename>', methods=['GET'])
def serve_image(filename):
    """
    Serves uploaded images from the uploads directory.
    """
    try:
        uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
        return send_from_directory(uploads_dir, filename)
    except Exception as e:
        print(f"ERROR serving image {filename}: {str(e)}")
        return jsonify({"error": str(e)}), 404

# Add helper function at the end of the file
def format_time_ago(timestamp):
    """
    Formats a timestamp to show how long ago it was reported
    """
    now = datetime.datetime.now()
    diff = now - timestamp
    
    if diff.total_seconds() < 60:
        return "less than a minute ago"
    elif diff.total_seconds() < 3600:
        minutes = int(diff.total_seconds() / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif diff.total_seconds() < 86400:
        hours = int(diff.total_seconds() / 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    else:
        days = int(diff.total_seconds() / 86400)
        return f"{days} day{'s' if days != 1 else ''} ago"

