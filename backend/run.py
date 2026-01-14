#!/usr/bin/env python3
"""
SeniorSmartAssist Backend Server
Run this script to start the server from the backend directory
"""
import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from src.main.app import create_app

if __name__ == '__main__':
    app, socketio = create_app()
    
    # Get port from environment variable (Railway provides PORT)
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print("=" * 60)
    print("🚀 SeniorSmartAssist Backend Server")
    print("=" * 60)
    print(f"📊 Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print(f"🌐 Server: http://{host}:{port}")
    print(f"📡 WebSocket: ws://{host}:{port}/socket.io/")
    print("=" * 60)
    print("Press CTRL+C to stop the server")
    print()
    
    socketio.run(app, host=host, port=port, debug=debug)
