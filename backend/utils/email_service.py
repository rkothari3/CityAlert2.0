import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from config import SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SENDER_EMAIL, SENDER_NAME, BASE_URL

def send_incident_alert_email(recipient_email, incident_data):
    """
    Sends an incident alert email to a subscribed user.
    
    Args:
        recipient_email (str): The email address to send the alert to
        incident_data (dict): The incident information
    """
    try:
        print(f"📧 Attempting to send alert email to: {recipient_email}")
        print(f"📧 SMTP Config - Server: {SMTP_SERVER}, Port: {SMTP_PORT}, Username: {SMTP_USERNAME}")
        
        # Validate email configuration
        if not all([SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SENDER_EMAIL]):
            print("❌ Email configuration incomplete - missing required settings")
            return False
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = f"CityAlert: New {incident_data['department_classification']} Incident Reported"
        message["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
        message["To"] = recipient_email

        # Format the incident timestamp
        incident_time = datetime.fromisoformat(incident_data['timestamp'].replace('Z', '+00:00'))
        formatted_time = incident_time.strftime("%B %d, %Y at %I:%M %p")

        # Create the email content
        text_content = f"""
CityAlert Incident Notification

A new incident has been reported in your area:

Description: {incident_data['description']}
Location: {incident_data['location']}
Department: {incident_data['department_classification']}
Status: {incident_data['status'].replace('_', ' ').title()}
Reported: {formatted_time}

View all current alerts: {BASE_URL}/public/alerts.html

To unsubscribe from these alerts, visit: {BASE_URL}/api/subscriptions/unsubscribe?email={recipient_email}

---
CityAlert - Your City, Safer Together
        """

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 28px;">CityAlert</h1>
                    <p style="color: #6b7280; margin: 5px 0 0 0;">Incident Notification</p>
                </div>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
                    <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">New Incident Reported</h2>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #374151;">Description:</strong>
                        <p style="margin: 5px 0; color: #4b5563;">{incident_data['description']}</p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #374151;">Location:</strong>
                        <p style="margin: 5px 0; color: #4b5563;">{incident_data['location']}</p>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <div>
                            <strong style="color: #374151;">Department:</strong>
                            <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 5px;">{incident_data['department_classification']}</span>
                        </div>
                        <div>
                            <strong style="color: #374151;">Status:</strong>
                            <span style="background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 5px;">{incident_data['status'].replace('_', ' ').title()}</span>
                        </div>
                    </div>
                    
                    <div>
                        <strong style="color: #374151;">Reported:</strong>
                        <span style="color: #4b5563;">{formatted_time}</span>
                    </div>
                </div>
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <a href="{BASE_URL}/public/alerts.html" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View All Current Alerts</a>
                </div>
                
                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        <a href="{BASE_URL}/api/subscriptions/unsubscribe?email={recipient_email}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> from these alerts
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">CityAlert - Your City, Safer Together</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Create MIMEText objects
        text_part = MIMEText(text_content, "plain")
        html_part = MIMEText(html_content, "html")

        # Add parts to message
        message.attach(text_part)
        message.attach(html_part)

        # Send the email with detailed error handling
        print(f"📧 Connecting to SMTP server: {SMTP_SERVER}:{SMTP_PORT}")
        context = ssl.create_default_context()
        
        # --- MODIFICATION START ---
        if SMTP_PORT == 465:
            # Use SMTP_SSL for port 465 (SSL/TLS from start)
            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as server:
                print(f"📧 Logging in with username: {SMTP_USERNAME}")
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                
                print(f"📧 Sending email from {SENDER_EMAIL} to {recipient_email}")
                server.sendmail(SENDER_EMAIL, recipient_email, message.as_string())
        else:
            # Use SMTP with starttls for other ports (e.g., 587)
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                print("📧 Starting TLS...")
                server.starttls(context=context)
                
                print(f"📧 Logging in with username: {SMTP_USERNAME}")
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                
                print(f"📧 Sending email from {SENDER_EMAIL} to {recipient_email}")
                server.sendmail(SENDER_EMAIL, recipient_email, message.as_string())
        # --- MODIFICATION END ---
            
        print(f"✅ Alert email sent successfully to {recipient_email}")
        return True

    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ SMTP Authentication failed: {str(e)}")
        print("💡 Check your email credentials and app password")
        return False
    except smtplib.SMTPException as e:
        print(f"❌ SMTP error occurred: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Failed to send alert email to {recipient_email}: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        return False

def send_subscription_confirmation_email(recipient_email):
    """
    Sends a confirmation email when a user subscribes to alerts.
    """
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Welcome to CityAlert Notifications!"
        message["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
        message["To"] = recipient_email

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Welcome to CityAlert!</h1>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <p>Thank you for subscribing to CityAlert incident notifications!</p>
                    <p>You will now receive email alerts when new incidents are reported in your city. This helps you stay informed about safety issues in your community.</p>
                </div>
                
                <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #0369a1;"><strong>What to expect:</strong></p>
                    <ul style="margin: 10px 0; color: #0369a1;">
                        <li>Real-time notifications for new incidents</li>
                        <li>Information about incident type, location, and status</li>
                        <li>Links to view more details on our alerts page</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <a href="{BASE_URL}/public/alerts.html" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Current Alerts</a>
                </div>
                
                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        You can <a href="{BASE_URL}/api/subscriptions/unsubscribe?email={recipient_email}" style="color: #6b7280; text-decoration: underline;">unsubscribe</a> at any time.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        html_part = MIMEText(html_content, "html")
        message.attach(html_part)

        # Send the email
        context = ssl.create_default_context()
        
        # --- MODIFICATION START ---
        if SMTP_PORT == 465:
            # Use SMTP_SSL for port 465 (SSL/TLS from start)
            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as server:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(SENDER_EMAIL, recipient_email, message.as_string())
        else:
            # Use SMTP with starttls for other ports (e.g., 587)
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls(context=context)
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(SENDER_EMAIL, recipient_email, message.as_string())
        # --- MODIFICATION END ---
            
        print(f"✓ Confirmation email sent successfully to {recipient_email}")
        return True

    except Exception as e:
        print(f"✗ Failed to send confirmation email to {recipient_email}: {str(e)}")
        return False

def send_status_update_email(recipient_email, incident_data, old_status, new_status):
    """
    Sends an incident status update email to a subscribed user.
    
    Args:
        recipient_email (str): The email address to send the update to
        incident_data (dict): The incident information
        old_status (str): The previous status
        new_status (str): The new status
    """
    try:
        print(f"📧 Attempting to send status update email to: {recipient_email}")
        
        # Validate email configuration
        if not all([SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SENDER_EMAIL]):
            print("❌ Email configuration incomplete - missing required settings")
            return False
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = f"CityAlert: Incident Status Updated - {incident_data['department_classification']}"
        message["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
        message["To"] = recipient_email

        # Format the incident timestamp
        incident_time = datetime.fromisoformat(incident_data['timestamp'].replace('Z', '+00:00'))
        formatted_time = incident_time.strftime("%B %d, %Y at %I:%M %p")

        # Create status display names
        status_names = {
            'reported': 'Reported',
            'in_progress': 'In Progress', 
            'resolved': 'Resolved'
        }
        
        old_status_display = status_names.get(old_status, old_status.replace('_', ' ').title())
        new_status_display = status_names.get(new_status, new_status.replace('_', ' ').title())

        # Create the email content
        text_content = f"""
CityAlert Status Update

An incident you may be interested in has been updated:

Description: {incident_data['description']}
Location: {incident_data['location']}
Department: {incident_data['department_classification']}
Status Changed: {old_status_display} → {new_status_display}
Originally Reported: {formatted_time}

View all current alerts: {BASE_URL}/public/alerts.html

To unsubscribe from these alerts, visit: {BASE_URL}/api/subscriptions/unsubscribe?email={recipient_email}

---
CityAlert - Your City, Safer Together
        """

        # Create status color coding
        status_colors = {
            'reported': '#ef4444',     # Red
            'in_progress': '#f59e0b',  # Yellow/Orange
            'resolved': '#10b981'      # Green
        }
        
        new_status_color = status_colors.get(new_status, '#6b7280')

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 28px;">CityAlert</h1>
                    <p style="color: #6b7280; margin: 5px 0 0 0;">Status Update</p>
                </div>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid {new_status_color}; margin-bottom: 20px;">
                    <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Incident Status Updated</h2>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #374151;">Description:</strong>
                        <p style="margin: 5px 0; color: #4b5563;">{incident_data['description']}</p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #374151;">Location:</strong>
                        <p style="margin: 5px 0; color: #4b5563;">{incident_data['location']}</p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #374151;">Status Update:</strong>
                        <div style="margin: 5px 0;">
                            <span style="background-color: #e5e7eb; color: #374151; padding: 4px 8px; border-radius: 12px; font-size: 12px; text-decoration: line-through;">{old_status_display}</span>
                            <span style="margin: 0 8px; color: #6b7280;">→</span>
                            <span style="background-color: {new_status_color}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">{new_status_display}</span>
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <div>
                            <strong style="color: #374151;">Department:</strong>
                            <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 5px;">{incident_data['department_classification']}</span>
                        </div>
                    </div>
                    
                    <div>
                        <strong style="color: #374151;">Originally Reported:</strong>
                        <span style="color: #4b5563;">{formatted_time}</span>
                    </div>
                </div>
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <a href="{BASE_URL}/public/alerts.html" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View All Current Alerts</a>
                </div>
                
                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        <a href="{BASE_URL}/api/subscriptions/unsubscribe?email={recipient_email}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> from these alerts
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">CityAlert - Your City, Safer Together</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Create MIMEText objects
        text_part = MIMEText(text_content, "plain")
        html_part = MIMEText(html_content, "html")

        # Add parts to message
        message.attach(text_part)
        message.attach(html_part)

        # Send the email with existing SMTP logic
        context = ssl.create_default_context()
        
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as server:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(SENDER_EMAIL, recipient_email, message.as_string())
        else:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls(context=context)
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(SENDER_EMAIL, recipient_email, message.as_string())
            
        print(f"✅ Status update email sent successfully to {recipient_email}")
        return True

    except Exception as e:
        print(f"❌ Failed to send status update email to {recipient_email}: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        return False
