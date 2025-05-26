# backend/utils/geocoding.py

import requests
import json
from config import GOOGLE_MAPS_API_KEY

def geocode_address(address):
    """
    Converts a human-readable address to latitude and longitude coordinates
    using Google's Geocoding API.
    
    Args:
        address (str): The human-readable address to geocode
        
    Returns:
        tuple: (latitude, longitude) if successful, (None, None) if failed
        
    Example:
        lat, lng = geocode_address("1600 Amphitheatre Parkway, Mountain View, CA")
        # Returns: (37.4224764, -122.0842499)
    """
    if not address or not address.strip():
        print("WARNING: Empty address provided for geocoding")
        return None, None
    
    if not GOOGLE_MAPS_API_KEY:
        print("WARNING: Google Maps API key not configured")
        return None, None
    
    try:
        # Clean up the address - remove extra whitespace
        clean_address = address.strip()
        
        # Google Geocoding API endpoint
        base_url = "https://maps.googleapis.com/maps/api/geocode/json"
        
        # Parameters for the API request
        params = {
            'address': clean_address,
            'key': GOOGLE_MAPS_API_KEY
        }
        
        print(f"Geocoding address: {clean_address}")
        
        # Make the API request
        response = requests.get(base_url, params=params, timeout=10)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Parse the JSON response
        data = response.json()
        
        # Check if the geocoding was successful
        if data['status'] == 'OK' and data['results']:
            # Extract latitude and longitude from the first result
            location = data['results'][0]['geometry']['location']
            latitude = location['lat']
            longitude = location['lng']
            
            print(f"✓ Geocoded '{clean_address}' to ({latitude}, {longitude})")
            return latitude, longitude
            
        elif data['status'] == 'ZERO_RESULTS':
            print(f"WARNING: No results found for address: {clean_address}")
            return None, None
            
        elif data['status'] == 'OVER_QUERY_LIMIT':
            print("ERROR: Google Maps API query limit exceeded")
            return None, None
            
        elif data['status'] == 'REQUEST_DENIED':
            print("ERROR: Google Maps API request denied - check API key")
            return None, None
            
        else:
            print(f"ERROR: Geocoding failed with status: {data['status']}")
            return None, None
            
    except requests.exceptions.Timeout:
        print("ERROR: Geocoding request timed out")
        return None, None
        
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Network error during geocoding: {e}")
        return None, None
        
    except json.JSONDecodeError:
        print("ERROR: Invalid JSON response from geocoding API")
        return None, None
        
    except KeyError as e:
        print(f"ERROR: Unexpected response format from geocoding API: {e}")
        return None, None
        
    except Exception as e:
        print(f"ERROR: Unexpected error during geocoding: {e}")
        return None, None

def reverse_geocode(latitude, longitude):
    """
    Converts latitude and longitude coordinates to a human-readable address.
    This is the opposite of geocoding.
    
    Args:
        latitude (float): The latitude coordinate
        longitude (float): The longitude coordinate
        
    Returns:
        str: The formatted address if successful, None if failed
    """
    if not GOOGLE_MAPS_API_KEY:
        print("WARNING: Google Maps API key not configured")
        return None
    
    try:
        # Google Reverse Geocoding API endpoint
        base_url = "https://maps.googleapis.com/maps/api/geocode/json"
        
        # Parameters for the API request
        params = {
            'latlng': f"{latitude},{longitude}",
            'key': GOOGLE_MAPS_API_KEY
        }
        
        print(f"Reverse geocoding coordinates: ({latitude}, {longitude})")
        
        # Make the API request
        response = requests.get(base_url, params=params, timeout=10)
        response.raise_for_status()
        
        # Parse the JSON response
        data = response.json()
        
        # Check if the reverse geocoding was successful
        if data['status'] == 'OK' and data['results']:
            # Return the formatted address from the first result
            formatted_address = data['results'][0]['formatted_address']
            print(f"✓ Reverse geocoded ({latitude}, {longitude}) to '{formatted_address}'")
            return formatted_address
        else:
            print(f"ERROR: Reverse geocoding failed with status: {data['status']}")
            return None
            
    except Exception as e:
        print(f"ERROR: Unexpected error during reverse geocoding: {e}")
        return None
