# backend/config.py

import os

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

# A secret key is needed for Flask to secure sessions and other things.
# In a real-world application, this should be a strong, randomly generated key
# stored securely (e.g., in an environment variable).
# For now, we'll use a simple placeholder.
SECRET_KEY = 'your_super_secret_key_here' # TODO: Change this to a strong, random key in production!

