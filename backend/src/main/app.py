from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from src.main.models import db, Volunteer, Elder
from src.main.routes import bp as api_bp
from src.main.events import register_socket_events
import os
from dotenv import load_dotenv

load_dotenv()

def create_app(test_config=None):
    """Application factory pattern."""
    app = Flask(__name__)
    
    if test_config is None:
        # Use PostgreSQL if DATABASE_URL is set, otherwise default to SQLite
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///seniorsmartassist.db')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    else:
        app.config.update(test_config)
    
    CORS(app)
    db.init_app(app)
    
    socketio = SocketIO(app, cors_allowed_origins="*")
    app.extensions['socketio'] = socketio
    register_socket_events(socketio)
    app.register_blueprint(api_bp, url_prefix='/api/seniorsmartassist')
    
    with app.app_context():
        db.create_all()
        # Initialize with sample data only if not in testing mode and database is empty
        if not app.config.get('TESTING', False):
            if Volunteer.query.count() == 0:
                volunteers = [
                    Volunteer(name="Alice Chen", email="alice@example.com", phone="555-0101", address="123 Main St, San Francisco, CA", skills="Groceries, Transportation, Companionship", availability="available"),
                    Volunteer(name="Bob Martinez", email="bob@example.com", phone="555-0102", address="456 Market St, San Francisco, CA", skills="Medical Assistance, Home Maintenance", availability="available"),
                    Volunteer(name="Carol Johnson", email="carol@example.com", phone="555-0103", address="789 Mission St, San Francisco, CA", skills="Technology Help, Groceries", availability="available"),
                    Volunteer(name="David Kim", email="david@example.com", phone="555-0104", address="321 Castro St, San Francisco, CA", skills="House Shifting, Home Maintenance, Transportation", availability="available"),
                    Volunteer(name="Emma Wilson", email="emma@example.com", phone="555-0105", address="654 Valencia St, San Francisco, CA", skills="Companionship, Medical Assistance", availability="available")
                ]
                db.session.add_all(volunteers)
                print(f"✅ Loaded {len(volunteers)} sample volunteers")
            
            if Elder.query.count() == 0:
                elders = [
                    Elder(name="Mary Johnson", email="mary@example.com", phone="555-0201", address="123 Oak St, San Francisco, CA", age=72),
                    Elder(name="John Smith", email="john@example.com", phone="555-0202", address="456 Elm St, San Francisco, CA", age=68),
                    Elder(name="Patricia Brown", email="patricia@example.com", phone="555-0203", address="789 Pine St, San Francisco, CA", age=75),
                    Elder(name="Robert Davis", email="robert@example.com", phone="555-0204", address="321 Maple Ave, San Francisco, CA", age=70),
                    Elder(name="Linda Garcia", email="linda@example.com", phone="555-0205", address="654 Cedar Ln, San Francisco, CA", age=66)
                ]
                db.session.add_all(elders)
                print(f"✅ Loaded {len(elders)} sample elders")
            
            db.session.commit()
            print("✅ Sample data initialized successfully")
    
    return app, socketio

if __name__ == '__main__':
    app, socketio = create_app()
    print("Starting SeniorSmartAssist server...")
    print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print("Server running on http://0.0.0.0:5000")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
