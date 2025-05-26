from flask import Flask, request, jsonify
from flask_cors import CORS
from hr_service import HRService, ReActAgentHR
from finance_service import FinanceService, ReActAgentFinance
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize services
try:
    logger.info("Initializing HR Service...")
    hr_service = HRService()
    logger.info("HR Service initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize HR Service: {str(e)}")
    hr_service = None

try:
    logger.info("Initializing Finance Service...")
    finance_service = FinanceService()
    logger.info("Finance Service initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Finance Service: {str(e)}")
    finance_service = None

@app.route('/api/chat', methods=['POST'])
def chat():
    logger.debug(f"Received chat request: {request.json}")
    data = request.json
    query = data.get('query', '')
    domain = data.get('domain', 'hr')  # Default to HR if not specified
    
    try:
        if domain.lower() == 'hr':
            if hr_service is None:
                return jsonify({'error': 'HR Service is not available'}), 503
            logger.info(f"Processing HR query: {query}")
            response = hr_service.process_query(query)
        elif domain.lower() == 'finance':
            if finance_service is None:
                return jsonify({'error': 'Finance Service is not available'}), 503
            logger.info(f"Processing Finance query: {query}")
            response = finance_service.process_query(query)
        else:
            logger.warning(f"Invalid domain specified: {domain}")
            return jsonify({'error': 'Invalid domain specified'}), 400
            
        logger.info(f"Generated response for {domain}: {response[:100]}...")
        return jsonify({
            'response': response,
            'domain': domain
        })
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    status = {
        'status': 'healthy',
        'services': {
            'hr': hr_service is not None,
            'finance': finance_service is not None
        }
    }
    logger.info(f"Health check: {status}")
    return jsonify(status)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    logger.info(f"Starting Flask server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True) 