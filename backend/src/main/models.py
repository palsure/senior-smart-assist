from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Elder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.String(200))
    age = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Volunteer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.String(200))
    skills = db.Column(db.String(500))
    gender = db.Column(db.String(20))  # Male, Female, Other
    has_car = db.Column(db.Boolean, default=False)
    availability = db.Column(db.String(20), default='available')  # available, busy, unavailable
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class HelpRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    elder_id = db.Column(db.Integer, db.ForeignKey('elder.id'))
    volunteer_id = db.Column(db.Integer, db.ForeignKey('volunteer.id'))
    request_type = db.Column(db.String(50))
    description = db.Column(db.String(500))
    status = db.Column(db.String(20), default='pending')  # pending, assigned, in_progress, completed, cancelled
    address = db.Column(db.String(200))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    assigned_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    rating = db.Column(db.Integer)  # Rating from 1-5 stars
    rating_comment = db.Column(db.String(500))  # Optional comment with rating
    elder = db.relationship('Elder', backref='requests')
    volunteer = db.relationship('Volunteer', backref='assigned_requests')

class Contribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    contributor_name = db.Column(db.String(100), nullable=False)
    contributor_email = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    volunteer_id = db.Column(db.Integer, db.ForeignKey('volunteer.id'), nullable=True)
    message = db.Column(db.String(500))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    volunteer = db.relationship('Volunteer', backref='contributions')

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey('help_request.id'), nullable=False)
    sender_id = db.Column(db.Integer, nullable=False)  # Can be elder_id or volunteer_id
    sender_type = db.Column(db.String(20), nullable=False)  # 'elder' or 'volunteer'
    message = db.Column(db.String(1000), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    request = db.relationship('HelpRequest', backref='chat_messages')

class Reward(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey('help_request.id'), nullable=False)
    volunteer_id = db.Column(db.Integer, db.ForeignKey('volunteer.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    request = db.relationship('HelpRequest', backref='rewards')
    volunteer = db.relationship('Volunteer', backref='rewards')
