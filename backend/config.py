# backend/config.py

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the base directory of the project (where app.py is located)
# This ensures that our database file is created in the correct place,
# relative to the backend directory.
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Define the path for the SQLite database file.
# SQLALCHEMY_DATABASE_URI specifies the database connection string.
# 'sqlite:///' means it's a SQLite database.
# os.path.join(BASE_DIR, 'site.db') creates a path to a file named 'site.db'
# inside the 'backend' directory.
SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, 'site.db')

# SQLALCHEMY_TRACK_MODIFICATIONS is set to False to disable
# a feature that tracks modifications to objects and emits signals.
# This consumes extra memory and is not needed for our purposes.
SQLALCHEMY_TRACK_MODIFICATIONS = False

# Load secret key from environment variables
SECRET_KEY = os.environ.get('SECRET_KEY', 'fallback_dev_key')

# API Keys
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# Google Maps API Key for geocoding
# You'll need to get this from Google Cloud Console:
# 1. Go to https://console.cloud.google.com/
# 2. Create a new project or select existing one
# 3. Enable the "Geocoding API"
# 4. Create credentials (API key)
# 5. Optionally restrict the API key to your server's IP
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', '')  # Replace with your actual API key

# Email Configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '465'))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')  # Your email address
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')  # Your email password or app password
SENDER_EMAIL = os.getenv('SENDER_EMAIL', SMTP_USERNAME)
SENDER_NAME = os.getenv('SENDER_NAME', 'CityAlert Notifications')

# Base URL for unsubscribe links
BASE_URL = os.getenv('BASE_URL', 'http://127.0.0.1:5000')

