# CityAlert Project Structure

```

├── backend/                    # Backend API server
│   ├── app.py                  # Main Flask application
│   ├── config.py               # Configuration settings
│   ├── requirements.txt        # Python dependencies
│   ├── models/                 # Database models
│   │   └── __init__.py
│   ├── routes/                 # API routes
│   │   ├── __init__.py
│   │   ├── incidents.py
│   │   └── departments.py
│   └── utils/                  # Utility functions
│       └── __init__.py
│
├── public/                     # Public-facing frontend
│   ├── index.html              # Home page
│   ├── alerts.html             # Alerts page
│   ├── resources.html          # Resources page
│   ├── css/
│   │   └── style.css         # Main styles
│   ├── js/
│   │   ├── main.js          # Main JavaScript
│   │   └── chat.js            # Chat interface logic
│   └── assets/                # Images, icons, etc.
│
├── departments/               # Departments/Admin frontend
│   ├── index.html              # Login/Dashboard
│   ├── login.html              # Department login
│   ├── incident-detail.html    # Incident details view
│   ├── css/
│   │   └── style.css         # Admin styles
│   └── js/
│       ├── main.js          # Admin JavaScript
│       └── dashboard.js       # Dashboard logic
│
├── .gitignore
|-- CHANGELOG.md
|-- project_structure.md (This File)
└── README.md
```

## Key Features

### Public Frontend
- Clean, responsive design for all devices
- Intuitive incident reporting via chat interface
- Real-time alerts and updates
- Helpful resources for common scenarios

### Department Frontend
- Secure department-specific access
- Dashboard for incident management
- Detailed incident views with update capabilities
- Status tracking and resolution workflow

### Backend
- RESTful API with Flask
- SQLite database for data persistence
- Department-based access control
- Gemini AI integration for incident classification
