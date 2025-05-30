- Duplicate incident detection.
- ✅ Map based location selection and map used to showcase different reported incidents all over the place.
- ✅ The departmental can dispatch alerts to users in the database. Built user profile stuff for this using email subscriptions.

## Recently Completed:
- ✅ Interactive maps showing incident locations with color-coded markers
- ✅ Map integration in both public alerts page and department dashboard
- ✅ Geocoding of addresses to latitude/longitude coordinates
- ✅ Click-to-focus map functionality from incident cards
- ✅ Real-time map updates when incidents are added or status changes
- ✅ Custom marker styling based on incident status and department
- ✅ Complete department dashboard map integration with error handling
- ✅ Department-specific incident filtering on interactive maps
- ✅ Email alert system for public users with subscription management
- ✅ Email notifications sent automatically when new incidents are reported
- ✅ User subscription system with department filtering options
- ✅ Email confirmation and unsubscribe functionality

# CityAlert Development TODO

## ✅ Completed Features

### Duplicate Incident Detection
- **Backend**: Enhanced duplicate detection logic in `/backend/routes/incidents.py`
  - Checks for exact duplicates within the last hour
  - Detects similar incidents at the same location with same department classification
  - Returns detailed information about existing incidents with formatted timestamps
  - Provides helpful messages directing users to the Alerts page

- **Frontend**: Updated chatbot in `/public/js/chat.js` 
  - Handles 409 Conflict responses for duplicate incidents
  - Displays existing incident details in a formatted card
  - Provides action buttons to "View Alerts Page" or "Report Different Incident"
  - Gracefully resets chat state after duplicate detection

- **UI**: Added styles in `/public/css/style.css`
  - Warning-style highlighting for duplicate incident messages
  - Status indicators for existing incidents
  - Interactive buttons with hover effects

## 🔄 Current Features

### Incident Reporting System
- Gemini AI-powered chatbot for natural incident reporting
- Image upload and analysis capabilities
- Location autocomplete with Google Places API
- Real-time incident submission with validation

### Interactive Maps
- Google Maps integration showing incident locations
- Real-time incident markers with status indicators
- Click-to-focus functionality on incidents

### Department Dashboard
- Department-specific incident views
- Status management (reported → in_progress → resolved)
- Secure incident deletion with department key verification

### Email Alert System
- **Backend**: Comprehensive email notification system in `/backend/utils/email_service.py`
  - Incident alert emails sent automatically when new incidents are reported
  - Status update emails sent when incident status changes (reported → in_progress → resolved)
  - Department-specific filtering for targeted notifications
  - HTML and text email templates with professional styling
  - Support for Gmail SMTP and other email providers

- **Subscription Management**: User subscription system in `/backend/routes/subscriptions.py`
  - Email subscription with optional department filtering
  - Confirmation emails for new subscriptions
  - Unsubscribe functionality with direct links
  - Active subscription management

- **Frontend Integration**: Email subscription form in `/public/resources.html`
  - User-friendly subscription interface
  - Department filter selection options
  - Real-time feedback for subscription actions

## 🚀 Future Enhancements

### Duplicate Detection Improvements
- [ ] Add fuzzy matching for descriptions (e.g., "car crash" vs "vehicle accident")
- [ ] Implement geographic radius checking (incidents within X meters)
- [ ] Add similarity scoring algorithm for better duplicate detection
- [ ] Allow users to "confirm different incident" after duplicate warning

### Real-time Features
- [ ] WebSocket integration for real-time incident updates
- [ ] Push notifications for department dashboards
- [ ] Live status updates on the public Alerts page

### Analytics & Reporting
- [ ] Incident trend analysis
- [ ] Department response time tracking
- [ ] Geographic incident heat maps
- [ ] Monthly/yearly incident reports

### Mobile Experience
- [ ] Progressive Web App (PWA) features
- [ ] GPS location detection for mobile users
- [ ] Offline incident reporting capabilities
- [ ] Push notifications for mobile users

### Advanced Features
- [ ] Multi-language support
- [ ] Voice-to-text incident reporting
- [ ] Integration with existing emergency services
- [ ] Automated incident severity assessment

### Email Features
- [ ] Automated incident severity assessment
- [ ] User dashboard for managing email preferences
- [ ] SMS alert integration for critical incidents
- [ ] Push notification support for web browsers
- [ ] Email digest options (daily/weekly summaries)