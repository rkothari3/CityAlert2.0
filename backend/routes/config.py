from flask import Blueprint, Response
from config import GOOGLE_MAPS_API_KEY

config_bp = Blueprint('config', __name__)

@config_bp.route('/js/config.js')
def config_js():
    config_js = f"""
    // This file is auto-generated. Do not edit directly.
    window.CITY_ALERT_CONFIG = {{
        MAPS_API_KEY: "{GOOGLE_MAPS_API_KEY}"
    }};
    """
    response = Response(config_js, content_type='application/javascript')
    return response