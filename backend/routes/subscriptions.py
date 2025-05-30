from flask import Blueprint, request, jsonify, redirect, render_template_string
from database import db
from models import UserSubscription
from utils.email_service import send_subscription_confirmation_email
import re

subscriptions_bp = Blueprint('subscriptions_bp', __name__)

def is_valid_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@subscriptions_bp.route('/subscriptions/subscribe', methods=['POST'])
def subscribe_to_alerts():
    """
    Subscribe a user to incident alerts.
    Expects JSON with 'email' and optionally 'department_filter'.
    """
    try:
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({"error": "Email is required"}), 400

        email = data['email'].strip().lower()
        department_filter = data.get('department_filter', '').strip()

        if not is_valid_email(email):
            return jsonify({"error": "Invalid email format"}), 400

        # Check if user is already subscribed
        existing_subscription = UserSubscription.query.filter_by(email=email).first()
        
        if existing_subscription:
            if existing_subscription.is_active:
                return jsonify({"message": "Email is already subscribed to alerts"}), 200
            else:
                # Reactivate the subscription
                existing_subscription.is_active = True
                existing_subscription.department_filter = department_filter if department_filter else None
                db.session.commit()
                return jsonify({"message": "Subscription reactivated successfully"}), 200

        # Create new subscription
        new_subscription = UserSubscription(
            email=email,
            department_filter=department_filter if department_filter else None
        )

        db.session.add(new_subscription)
        db.session.commit()

        # Send confirmation email
        send_subscription_confirmation_email(email)

        print(f"✓ New subscription created for {email}")
        return jsonify({
            "message": "Successfully subscribed to incident alerts",
            "subscription": new_subscription.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"ERROR creating subscription: {str(e)}")
        return jsonify({"error": str(e)}), 500

@subscriptions_bp.route('/subscriptions/unsubscribe', methods=['GET', 'POST'])
def unsubscribe_from_alerts():
    """
    Unsubscribe a user from incident alerts.
    Can be called via GET with email parameter or POST with JSON.
    """
    try:
        if request.method == 'GET':
            email = request.args.get('email', '').strip().lower()
        else:
            data = request.get_json()
            email = data.get('email', '').strip().lower() if data else ''

        if not email or not is_valid_email(email):
            if request.method == 'GET':
                return render_template_string("""
                <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: #dc2626;">Invalid Email</h2>
                    <p>The email address provided is not valid.</p>
                </body>
                </html>
                """), 400
            return jsonify({"error": "Valid email is required"}), 400

        # Find the subscription
        subscription = UserSubscription.query.filter_by(email=email).first()
        
        if not subscription or not subscription.is_active:
            if request.method == 'GET':
                return render_template_string("""
                <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: #f59e0b;">Already Unsubscribed</h2>
                    <p>This email address is not currently subscribed to alerts.</p>
                </body>
                </html>
                """)
            return jsonify({"message": "Email is not currently subscribed"}), 200

        # Deactivate the subscription
        subscription.is_active = False
        db.session.commit()

        print(f"✓ Subscription deactivated for {email}")

        if request.method == 'GET':
            return render_template_string("""
            <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #16a34a;">Successfully Unsubscribed</h2>
                <p>You have been unsubscribed from CityAlert incident notifications.</p>
                <p style="margin-top: 30px;">
                    <a href="/public/index.html" style="color: #2563eb; text-decoration: none;">← Return to CityAlert</a>
                </p>
            </body>
            </html>
            """)
        
        return jsonify({"message": "Successfully unsubscribed from alerts"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"ERROR unsubscribing: {str(e)}")
        if request.method == 'GET':
            return render_template_string("""
            <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #dc2626;">Error</h2>
                <p>An error occurred while unsubscribing. Please try again later.</p>
            </body>
            </html>
            """), 500
        return jsonify({"error": str(e)}), 500

@subscriptions_bp.route('/subscriptions', methods=['GET'])
def get_subscriptions():
    """
    Get all active subscriptions (admin endpoint).
    """
    try:
        subscriptions = UserSubscription.query.filter_by(is_active=True).all()
        return jsonify([sub.to_dict() for sub in subscriptions]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
