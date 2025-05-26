# backend/models/__init__.py

# Import the 'db' object from your main Flask application instance (app.py)
# This 'db' object is our SQLAlchemy instance, which we use to define models.
from database import db
from datetime import datetime # Import datetime to store timestamps

# Define the Incident model
# This class represents the 'incidents' table in our database.
class Incident(db.Model):
    """
    Represents an incident reported by a civilian.

    Attributes:
        id (int): Primary key, unique identifier for the incident.
        description (str): A detailed description of the incident.
        location (str): The location where the incident occurred.
        latitude (float, optional): Latitude coordinate of the incident location.
        longitude (float, optional): Longitude coordinate of the incident location.
        image_url (str, optional): URL to an uploaded image related to the incident.
        department_classification (str): Comma-separated string of departments
                                         responsible for handling the incident (e.g., "POLICE,FIRE").
        status (str): Current status of the incident (e.g., "reported", "in_progress", "resolved").
                      Defaults to "reported".
        timestamp (datetime): The date and time when the incident was reported.
    """
    # Define the table name explicitly. By default, SQLAlchemy would use 'incident'.
    __tablename__ = 'incidents'

    # Define columns for the 'incidents' table
    id = db.Column(db.Integer, primary_key=True) # Integer primary key, auto-increments
    description = db.Column(db.Text, nullable=False) # Text field for incident description, cannot be empty
    location = db.Column(db.String(255), nullable=False) # String field for location, max 255 chars, cannot be empty
    latitude = db.Column(db.Float, nullable=True) # Float field for latitude coordinate, can be empty
    longitude = db.Column(db.Float, nullable=True) # Float field for longitude coordinate, can be empty
    image_url = db.Column(db.String(500), nullable=True) # String field for image URL, max 500 chars, can be empty
    department_classification = db.Column(db.String(255), nullable=False) # String for departments, cannot be empty
    status = db.Column(db.String(50), default='reported', nullable=False) # Status, default 'reported', cannot be empty
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False) # Timestamp, defaults to current UTC time

    # A __repr__ method for better debugging output when printing Incident objects
    def __repr__(self):
        return f"Incident(id={self.id}, status='{self.status}', departments='{self.department_classification}')"

    # A method to convert the Incident object to a dictionary, useful for JSON responses
    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'image_url': self.image_url,
            'department_classification': self.department_classification,
            'status': self.status,
            'timestamp': self.timestamp.isoformat() # Convert datetime to ISO format string
        }


# Define the Department model
# This class represents the 'departments' table in our database.
class Department(db.Model):
    """
    Represents a city department that can manage incidents.

    Attributes:
        id (int): Primary key, unique identifier for the department.
        name (str): The name of the department (e.g., "POLICE", "FIRE"). Must be unique.
        login_key (str): A unique key for department login.
    """
    __tablename__ = 'departments'

    id = db.Column(db.Integer, primary_key=True) # Integer primary key
    name = db.Column(db.String(100), unique=True, nullable=False) # Department name, must be unique and not empty
    login_key = db.Column(db.String(100), unique=True, nullable=False) # Login key, must be unique and not empty

    def __repr__(self):
        return f"Department(id={self.id}, name='{self.name}')"

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
            # Do NOT include login_key in to_dict for security reasons
        }

