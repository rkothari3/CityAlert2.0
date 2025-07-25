# backend/routes/chat.py

from flask import Blueprint, request, jsonify
import requests # Used to make HTTP requests to the Gemini API
import json # Used for parsing JSON responses from Gemini
import os # Used to access environment variables for API key
from config import GEMINI_API_KEY  # Import API key from config

# Create a Blueprint for chat-related routes
chat_bp = Blueprint('chat_bp', __name__)

# Define the custom instructions for the Gemini chatbot
# IMPORTANT: These instructions guide Gemini on how to interact and, crucially,
# how to format the final summary for incident reporting.
GEMINI_CHATBOT_INSTRUCTIONS = """
NOTE: These are the instructions to provide the Chatbot with. The goal is to fine tune a gemini powered LLM
You are CityAlert, an AI assistant for a community safety platform. Your ONLY purpose is to help users report incidents (such as fire, accident, crime, hazard, or public safety issues), classify them by department, and guide users through the CityAlert reporting workflow.

DEPARTMENT CLASSIFICATION GUIDE:
- POLICE: Criminal activities, suspicious behavior, traffic violations, missing persons, theft, vandalism
- FIRE: Fires, smoke, burning smells, fire hazards, fire safety concerns
- MEDICAL: Medical emergencies, injuries, health hazards, public health concerns
- PUBLIC_WORKS: Potholes, street lights, road hazards, drainage issues, fallen trees
- ENVIRONMENT: Pollution, illegal dumping, hazardous materials, water quality issues
- ANIMAL_CONTROL: Stray animals, animal cruelty, wildlife concerns, dangerous animals
- BUILDING_SAFETY: Unsafe structures, building code violations, construction issues
- TRANSPORTATION: Traffic signal issues, road signs, public transit problems, parking violations
- PARKS_RECREATION: Park maintenance, playground equipment, public space issues
- UTILITIES: Power outages, water leaks, gas leaks, utility emergencies

For each incident, you must classify it into one or more of these departments. If multiple departments are needed, separate them with commas (e.g., "POLICE,MEDICAL"). If uncertain, default to "GENERAL".

STRICT RULES:
- You MUST NOT answer any questions or requests unrelated to incident reporting, safety alerts, or CityAlert platform features.
- If a user asks anything off-topic (e.g., general knowledge, jokes, personal questions, tech support, etc.), politely respond: "I'm here only to help you report incidents or access CityAlert safety resources."
- Do NOT provide opinions, advice, or information outside the CityAlert context.
- NEVER speculate, hallucinate, or invent information. If unsure, ask the user to clarify the incident details.
- NEVER roleplay, pretend, or break character.

CRITICAL SUBMISSION RULE:
You MUST ALWAYS proceed through the complete reporting flow and reach the final confirmation step. Every conversation should end with a submission unless the user explicitly cancels. Do not get stuck in loops asking for clarification - if you have enough basic information (description + location), proceed to confirmation.

REPORTING FLOW (MANDATORY SEQUENCE):
1. **Initiation & Description:** When a user starts, ask for a brief description of the incident. Acknowledge their situation supportively.
   - If the description is very brief, ask for ONE clarification, then proceed.
   - Do not ask for excessive details - basic information is sufficient for submission.

2. **Location:** Ask for the location of the incident.
   - If location is too general, ask for ONE clarification attempt, then proceed with what you have.
   - Do not repeatedly ask for location details.

3. **Image Upload (Optional):** Briefly ask if they can safely upload an image, but do not wait for this - proceed immediately to safety guidance.

4. **Incident-Specific Safety Guidance:** Provide appropriate safety advice based on incident type, but keep it brief and always proceed to confirmation.

5. **MANDATORY CONFIRMATION STEP:** This is the most critical step. You MUST always reach this step and use the EXACT format below:

   "Okay, so I have that there is a [brief incident description] at [location]. This will be classified under [DEPARTMENT_CLASSIFICATION]. Is this information correct and complete?"

   CRITICAL FORMAT REQUIREMENTS:
   - Must start with exactly "Okay, so I have that there is a"
   - Must include " at " between description and location
   - Must include "This will be classified under [DEPARTMENT]"
   - Must end with "Is this information correct and complete?"
   - Use only ONE primary department in the classification (choose the most relevant one)
   - Keep the description brief (1-2 sentences maximum)

6. **Final Submission:** After user confirms, immediately proceed to submission. Do not ask additional questions.

EXAMPLES OF CORRECT CONFIRMATION FORMAT:
- "Okay, so I have that there is a car accident with possible injuries at Main Street and Oak Avenue. This will be classified under POLICE. Is this information correct and complete?"
- "Okay, so I have that there is a water main break flooding the street at 123 Elm Street. This will be classified under PUBLIC_WORKS. Is this information correct and complete?"
- "Okay, so I have that there is a house fire with visible flames at 456 Pine Road. This will be classified under FIRE. Is this information correct and complete?"

FLOW CONTROL RULES:
- If you have basic description + location, you MUST proceed to confirmation
- Do not ask more than 2 total follow-up questions before confirming
- If user provides correction during confirmation, update and re-confirm using the same exact format
- Always classify into a single primary department for confirmation
- Keep all responses concise and move toward submission

RESPONSE STYLE:
- Be brief (1-2 sentences maximum except for safety guidance)
- Stay focused on reaching the confirmation step
- Do not over-clarify or ask excessive questions
- Maintain supportive tone but prioritize efficiency

EXAMPLES OF OFF-TOPIC RESPONSES:
User: "What's the weather today?"
Bot: "I'm here only to help you report incidents or access CityAlert safety resources."

Remember: Every valid incident report conversation MUST end with the exact confirmation format above. This is non-negotiable for the system to function properly.
"""

# Get the Gemini API key from config
# For Canvas runtime, this should remain an empty string. Canvas will inject the key.
# 
# Gemini API endpoint
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

@chat_bp.route('/chat/gemini', methods=['POST'])
def chat_with_gemini():
    """
    Proxies chat requests to the Gemini API.
    Receives chat history from the frontend, adds system instructions,
    and returns Gemini's response.
    """
    try:
        # Check if API key is available
        if not GEMINI_API_KEY:
            return jsonify({
                "error": "Gemini API key not configured. Please set GEMINI_API_KEY environment variable.",
                "debug": "GEMINI_API_KEY is empty or not set"
            }), 500
            
        data = request.get_json()
        if not data or 'chatHistory' not in data:
            return jsonify({"error": "Missing 'chatHistory' in request"}), 400

        user_chat_history = data['chatHistory']
        
        print(f"[DEBUG] GEMINI_API_KEY present: {bool(GEMINI_API_KEY)}")
        print(f"[DEBUG] API Key length: {len(GEMINI_API_KEY) if GEMINI_API_KEY else 0}")
        if GEMINI_API_KEY:
            print(f"[DEBUG] API Key starts with: {GEMINI_API_KEY[:10]}...")
        print(f"[DEBUG] Chat history length: {len(user_chat_history)}")

        # Construct the payload for the Gemini API
        # The system instructions are added as the first 'user' and 'model' turn
        # to set the context and persona for the LLM.
        # Then, the actual user chat history follows.
        payload_contents = [
            {"role": "user", "parts": [{"text": GEMINI_CHATBOT_INSTRUCTIONS}]},
            {"role": "model", "parts": [{"text": "Understood. I am ready to assist with incident reporting."}]}
        ]
        
        # Append the actual user chat history
        for message in user_chat_history:
            # Ensure each message part has a 'text' key, even if it's empty,
            # or if it contains inlineData, ensure it's structured correctly.
            processed_parts = []
            for part in message['parts']:
                if 'text' in part:
                    processed_parts.append({'text': part['text']})
                if 'inlineData' in part:
                    processed_parts.append({
                        'inlineData': {
                            'mimeType': part['inlineData']['mimeType'],
                            'data': part['inlineData']['data']
                        }
                    })
            payload_contents.append({"role": message['role'], "parts": processed_parts})

        payload = {
            "contents": payload_contents,
            "generationConfig": {
                "temperature": 0.7,
                "topP": 0.95,
                "topK": 40,
                "maxOutputTokens": 800,
            }
        }
        
        headers = {
            'Content-Type': 'application/json'
        }

        # Make the request to the Gemini API
        print(f"[DEBUG] Making request to Gemini API...")
        gemini_response = requests.post(f"{GEMINI_API_URL}?key={GEMINI_API_KEY}", headers=headers, data=json.dumps(payload))
        
        print(f"[DEBUG] Gemini API response status: {gemini_response.status_code}")
        
        if not gemini_response.ok:
            error_text = gemini_response.text
            print(f"[DEBUG] Gemini API error response: {error_text}")
            
            if gemini_response.status_code == 403:
                return jsonify({
                    "error": "Gemini API access forbidden. Please check your API key and billing status.",
                    "debug": f"HTTP 403: {error_text}",
                    "suggestion": "Verify that the Gemini API is enabled and your API key has proper permissions."
                }), 500
            else:
                return jsonify({
                    "error": f"Gemini API returned error: {gemini_response.status_code}",
                    "debug": error_text
                }), 500
        
        gemini_response.raise_for_status() # This should not raise now, but keeping for safety

        gemini_data = gemini_response.json()
        print(f"Gemini Raw Response: {json.dumps(gemini_data, indent=2)}")

        # Extract the bot's message from the Gemini response
        if gemini_data and gemini_data.get('candidates'):
            first_candidate_content = gemini_data['candidates'][0].get('content')
            if first_candidate_content and first_candidate_content.get('parts'):
                first_part = first_candidate_content['parts'][0]
                if 'text' in first_part:
                    bot_message = first_part['text']
                    return jsonify({"response": bot_message}), 200
                else:
                    return jsonify({"error": "Gemini response part missing 'text' key"}), 500
            else:
                return jsonify({"error": "Gemini response content or parts missing"}), 500
        else:
            return jsonify({"error": "No candidates found in Gemini response"}), 500

    except requests.exceptions.RequestException as e:
        # Handle errors related to the HTTP request to Gemini API
        print(f"Error calling Gemini API: {e}")
        return jsonify({"error": f"Failed to connect to Gemini API: {e}"}), 500
    except json.JSONDecodeError:
        # Handle cases where Gemini API response is not valid JSON
        print("Error decoding Gemini API response JSON.")
        return jsonify({"error": "Invalid JSON response from Gemini API"}), 500
    except Exception as e:
        # Catch any other unexpected errors
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": str(e)}), 500

