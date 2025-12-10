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
    print("=" * 60)
    print("🚀 SeniorSmartAssist Backend Server")
    print("=" * 60)
    print(f"📊 Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print(f"🌐 Server: http://0.0.0.0:5000")
    print(f"📡 WebSocket: ws://0.0.0.0:5000/socket.io/")
    print("=" * 60)
    print("Press CTRL+C to stop the server")
    print()
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
