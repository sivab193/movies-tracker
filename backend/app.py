from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy", "service": "backend"})

from routes.movies import movies_bp
from routes.leaderboard import leaderboard_bp
from routes.users import users_bp

app.register_blueprint(movies_bp, url_prefix='/api/movies')
app.register_blueprint(leaderboard_bp, url_prefix='/api/leaderboard')
app.register_blueprint(users_bp, url_prefix='/api/users')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
