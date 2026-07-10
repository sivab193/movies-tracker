from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import sys

# Add current directory to python path for Vercel
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.url_map.strict_slashes = False
CORS(app) # Enable CORS for all routes

@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy", "service": "backend"})

from routes.movies import movies_bp
from routes.leaderboard import leaderboard_bp
from routes.users import users_bp
from routes.theaters import theaters_bp
from routes.stats import stats_bp

app.register_blueprint(movies_bp, url_prefix='/api/movies')
app.register_blueprint(leaderboard_bp, url_prefix='/api/leaderboard')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(theaters_bp, url_prefix='/api/theaters')
app.register_blueprint(stats_bp, url_prefix='/api/stats')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
