# CityAlert 2.0 Deployment Guide

## Free Deployment Overview
This guide will help you deploy CityAlert 2.0 using free services:
- **Backend**: Render.com (Free tier: 500 hours/month)
- **Frontend**: Netlify (Free tier: 100GB bandwidth)
- **Database**: SQLite (file-based, included with app)

## Prerequisites
- GitHub account
- Google Cloud Console account (for API keys)
- Gmail account (for SMTP)

## Step 1: Prepare Your Environment Variables

### Get Required API Keys

1. **Google Maps API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable "Maps JavaScript API" and "Geocoding API"
   - Create API key in Credentials section
   - Restrict key to your domains for security

2. **Google Gemini API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Create new API key
   - Copy the key for later use

3. **Gmail App Password** (for email notifications):
   - Enable 2-factor authentication on your Gmail
   - Generate an App Password in Google Account settings
   - Use this password (not your regular Gmail password)

## Step 2: Deploy Backend to Render

### 2.1 Prepare Backend for Deployment

Create a production configuration file for Render:

```bash
# In your backend/ directory, create render.yaml
```

### 2.2 Push to GitHub
1. Commit all your changes:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

### 2.3 Deploy on Render
1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure deployment:
   - **Name**: `cityalert-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && python app.py`
   - **Instance Type**: Free

### 2.4 Set Environment Variables in Render
In your Render dashboard, go to Environment tab and add:
```
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
SECRET_KEY=your_super_secret_key_here
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587 // Currently set to 465 might have to change
SMTP_USERNAME=your_gmail@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SENDER_EMAIL=your_gmail@gmail.com
SENDER_NAME=CityAlert Notifications
BASE_URL=https://your-render-app-name.onrender.com
```

## Step 3: Deploy Frontend to Netlify

### 3.1 Update Frontend Configuration
Update your frontend to use the deployed backend URL.

In your JavaScript files, replace `http://127.0.0.1:5000` with your Render backend URL.

### 3.2 Deploy on Netlify
1. Go to [netlify.com](https://netlify.com) and sign up
2. Drag and drop your `public/` folder to Netlify deploy area
3. Or connect GitHub repository:
   - Choose "New site from Git"
   - Connect GitHub and select repository
   - **Publish directory**: `public`
   - **Build command**: (leave empty)

### 3.3 Configure Custom Domain (Optional)
- In Netlify dashboard, go to Domain settings
- Add custom domain or use the provided `.netlify.app` subdomain

## Step 4: Update CORS and API Configuration

### 4.1 Update Backend CORS Settings
Your Flask app needs to allow requests from your Netlify domain.

### 4.2 Update Frontend API Base URL
Replace all instances of `http://127.0.0.1:5000` in your JavaScript files with your Render backend URL.

## Step 5: Test Your Deployment

1. **Test Backend**: Visit your Render URL (e.g., `https://cityalert-backend.onrender.com`)
2. **Test Frontend**: Visit your Netlify URL
3. **Test Full Flow**:
   - Try reporting an incident
   - Test email subscriptions
   - Verify department login functionality

## Common Issues & Solutions

### Backend Issues
- **503 Service Unavailable**: Render free tier sleeps after 15 minutes of inactivity. First request may take 30+ seconds.
- **Module Not Found**: Ensure `requirements.txt` includes all dependencies.
- **Database Issues**: SQLite database is recreated on each deployment. Consider upgrading to PostgreSQL for persistence.

### Frontend Issues
- **CORS Errors**: Ensure your backend allows requests from your Netlify domain.
- **API Not Found**: Double-check that all API endpoints use your Render backend URL.
- **Maps Not Loading**: Verify Google Maps API key is configured and domain is whitelisted.

### Email Issues
- **Emails Not Sending**: 
  - Verify Gmail app password (not regular password)
  - Ensure 2FA is enabled on Gmail
  - Check SMTP settings match Gmail requirements

## Cost Optimization

### Free Tier Limitations
- **Render**: 500 free hours/month, sleeps after 15min inactivity
- **Netlify**: 100GB bandwidth/month, 300 build minutes/month
- **Google APIs**: Generous free quotas for both Maps and Gemini

### Scaling Options
When you outgrow free tiers:
- **Render**: $7/month for always-on service
- **Database**: Consider PostgreSQL addon ($7/month)
- **Netlify**: $19/month for pro features

## Security Best Practices

1. **Environment Variables**: Never commit API keys to GitHub
2. **API Key Restrictions**: Restrict Google API keys to specific domains
3. **HTTPS**: Both Render and Netlify provide free SSL certificates
4. **CORS**: Configure strict CORS policies in production

## Maintenance

1. **Database Backups**: SQLite file is lost on Render redeploys. Consider PostgreSQL for important data.
2. **Monitoring**: Use Render and Netlify dashboards to monitor uptime and usage.
3. **Updates**: Push to GitHub to trigger automatic redeployments.

## Getting Help

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Google Cloud**: [cloud.google.com/docs](https://cloud.google.com/docs)

---

**Total Cost**: $0/month with free tiers
**Setup Time**: ~30-60 minutes
**Maintenance**: Minimal (automatic deployments)