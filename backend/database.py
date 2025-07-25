# backend/database.py

from flask_sqlalchemy import SQLAlchemy

# Initialize the SQLAlchemy instance here without passing the app initially.
# The app will be passed later using db.init_app(app).
db = SQLAlchemy()

