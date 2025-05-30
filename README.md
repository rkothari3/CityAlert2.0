<div align="center">
<img src="Project_Logo.png" alt="CityAlert Logo" width="200"/>
  
  # CityAlert 2.0
  
  **Your City, Safer Together**
  
  A modern community safety platform that connects citizens with city departments through AI-powered incident reporting and real-time alert systems.
  
  [![Flask](https://img.shields.io/badge/Flask-2.0+-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
  [![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
  [![Google Maps](https://img.shields.io/badge/Google_Maps_API-4285F4?style=flat-square&logo=google-maps&logoColor=white)](https://developers.google.com/maps)
</div>

## 🚨 Overview

CityAlert 2.0 is a comprehensive community safety platform designed to streamline incident reporting and emergency response coordination. Citizens can report incidents through an intelligent AI chatbot powered by Google's Gemini API, while city departments can efficiently manage and respond to reports through dedicated dashboards.

### ✨ Key Features

- **🤖 AI-Powered Incident Reporting**: Intelligent chatbot that guides users through the reporting process
- **🗺️ Location Services**: Integrated Google Maps with geocoding for precise incident locations
- **📧 Real-time Email Alerts**: Automated notifications for subscribed citizens and departments
- **🏛️ Department Dashboards**: Specialized interfaces for different city departments
- **📊 Data Visualization**: Interactive charts and maps for incident tracking
- **📱 Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **🔐 Secure Authentication**: Department-specific login systems
- **📸 Image Upload Support**: Photo evidence capability for incident reports

## 🏗️ Architecture

### Frontend
- **Framework**: Vanilla JavaScript with modern ES6+ features
- **Styling**: Tailwind CSS for responsive, utility-first design
- **Maps Integration**: Google Maps JavaScript API with Extended Components
- **Image Handling**: Base64 encoding for photo uploads
- **State Management**: Local storage for session persistence

### Backend
- **Framework**: Flask (Python web framework)
- **Database**: SQLite with SQLAlchemy ORM
- **API Integration**: Google Gemini AI for chatbot functionality
- **Email Service**: SMTP with HTML email templates
- **File Handling**: Local file storage for uploaded images
- **CORS**: Configured for cross-origin requests

### AI Integration
- **Chatbot**: Google Gemini 2.0 Flash model
- **Custom Instructions**: Specialized prompts for incident classification
- **Department Classification**: Automatic routing to appropriate city departments
- **Safety Protocols**: Built-in emergency guidance and 911 referrals

## 📁 Project Structure

```
CityAlert2.0/
├── 📁 backend/                     # Flask backend application
│   ├── 📄 app.py                   # Main Flask application entry point
│   ├── 📄 config.py                # Configuration settings and API keys
│   ├── 📄 database.py              # SQLAlchemy database initialization
│   ├── 📄 requirements.txt         # Python dependencies
│   ├── 📁 models/                  # Database models
│   │   └── 📄 __init__.py          # Incident, Department, UserSubscription models
│   ├── 📁 routes/                  # API route handlers
│   │   ├── 📄 chat.py              # Gemini AI chatbot integration
│   │   ├── 📄 config.py            # Configuration endpoint
│   │   ├── 📄 departments.py       # Department authentication & management
│   │   ├── 📄 incidents.py         # Incident CRUD operations
│   │   └── 📄 subscriptions.py     # Email subscription management
│   ├── 📁 utils/                   # Utility functions
│   │   ├── 📄 email_service.py     # Email notification system
│   │   └── 📄 geocoding.py         # Location geocoding services
│   └── 📁 uploads/                 # Uploaded incident images
├── 📁 public/                      # Public frontend files
│   ├── 📄 index.html               # Main landing page
│   ├── 📄 alerts.html              # Public alerts viewing page
│   ├── 📄 resources.html           # Community resources page
│   ├── 📄 dashboard.html           # Public dashboard (legacy)
│   ├── 📁 css/                     # Stylesheets
│   │   └── 📄 style.css            # Custom CSS styles
│   └── 📁 js/                      # Frontend JavaScript
│       ├── 📄 main.js              # Main application logic
│       ├── 📄 chat.js              # Chatbot interface
│       ├── 📄 alerts.js            # Alerts page functionality
│       ├── 📄 resources.js         # Resources page logic
│       ├── 📄 dashboard.js         # Dashboard functionality
│       └── 📄 map-utils.js         # Google Maps utilities
├── 📁 departments/                 # Department-specific interfaces
│   ├── 📄 login.html               # Department login page
│   ├── 📄 dashboard.html           # Department management dashboard
│   └── 📁 js/                      # Department JavaScript
│       ├── 📄 login.js             # Login functionality
│       └── 📄 dashboard.js         # Department dashboard logic
└── 📄 README.md                    # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Google Maps API Key
- Google Gemini API Key
- SMTP Email Service (Gmail recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CityAlert2.0
   ```

2. **Install Python dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   
   Create `backend/config.py` with your API keys:
   ```python
   # Database Configuration
   SQLALCHEMY_DATABASE_URI = 'sqlite:///cityalert.db'
   SQLALCHEMY_TRACK_MODIFICATIONS = False
   SECRET_KEY = 'your-secret-key-here'
   
   # Google APIs
   MAPS_API_KEY = 'your-google-maps-api-key'
   GEMINI_API_KEY = 'your-gemini-api-key'
   
   # Email Configuration
   SMTP_SERVER = 'smtp.gmail.com'
   SMTP_PORT = 587
   SMTP_USERNAME = 'your-email@gmail.com'
   SMTP_PASSWORD = 'your-app-password'
   SENDER_EMAIL = 'your-email@gmail.com'
   SENDER_NAME = 'CityAlert'
   BASE_URL = 'http://127.0.0.1:5000'
   ```

4. **Start the backend server**
   ```bash
   python app.py
   ```

5. **Serve the frontend**
   
   Use a local web server (e.g., Live Server in VS Code) to serve the frontend files:
   ```
   http://127.0.0.1:5500/public/index.html
   ```

### API Endpoints

#### Incidents
- `POST /api/incidents` - Create new incident
- `GET /api/incidents` - Retrieve all incidents
- `GET /api/incidents/<id>` - Get specific incident
- `PUT /api/incidents/<id>` - Update incident status
- `DELETE /api/incidents/<id>` - Delete incident

#### Departments
- `POST /api/departments/login` - Department authentication
- `GET /api/departments/<name>/incidents` - Get department-specific incidents

#### Subscriptions
- `POST /api/subscriptions/subscribe` - Subscribe to email alerts
- `GET /api/subscriptions/unsubscribe` - Unsubscribe from alerts

#### Chat
- `POST /api/chat/gemini` - Interact with AI chatbot

## 🎯 Usage

### For Citizens
1. **Report Incidents**: Click "Report an Incident" on the homepage
2. **AI Guidance**: Follow the chatbot's step-by-step questions
3. **Location & Photos**: Provide precise location and optional images
4. **Subscribe**: Get email notifications for new incidents in your area

### For City Departments
1. **Login**: Access department-specific dashboard with credentials
2. **Manage Incidents**: View, update, and resolve assigned incidents
3. **Map Visualization**: See incident locations on interactive maps
4. **Status Updates**: Change incident status (reported → in progress → resolved)

## 🛠️ Development

### Department Login Credentials
Default department login keys (for development):
- Police: `policekey`
- Fire: `firekey`
- Medical: `medicalkey`
- Public Works: `publicworkskey`
- Environment: `environmentkey`
- Animal Control: `animalkey`
- Building Safety: `buildingsafetykey`
- Transportation: `transportationkey`
- Parks & Recreation: `parkskey`
- Utilities: `utilitieskey`

### Database Schema

#### Incidents Table
- `id` - Primary key
- `description` - Incident description
- `location` - Address or location description
- `latitude/longitude` - Geocoded coordinates
- `department_classification` - Assigned departments
- `status` - Current status (reported/in_progress/resolved)
- `timestamp` - Creation timestamp
- `image_url` - Path to uploaded image

#### Departments Table
- `id` - Primary key
- `name` - Department name
- `login_key` - Authentication key

#### User Subscriptions Table
- `id` - Primary key
- `email` - Subscriber email
- `is_active` - Subscription status
- `department_filter` - Department preferences

## 🔧 Configuration

### Google Maps Setup
1. Enable Maps JavaScript API and Places API
2. Add your domain to API key restrictions
3. Configure the API key in `config.js`

### Email Service Setup
1. Use Gmail with App Passwords for SMTP
2. Configure SMTP settings in `backend/config.py`
3. HTML email templates with unsubscribe links

### Gemini AI Setup
1. Obtain API key from Google AI Studio
2. Custom system instructions for incident classification
3. Safety protocols and emergency guidance built-in

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


