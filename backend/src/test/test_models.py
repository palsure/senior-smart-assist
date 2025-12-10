import pytest
from src.main.models import db, Volunteer, HelpRequest

def test_volunteer_creation(app):
    """Test creating a volunteer."""
    with app.app_context():
        volunteer = Volunteer(name="Charlie", email="charlie@test.com", phone="555-0003", address="123 Main St")
        db.session.add(volunteer)
        db.session.commit()
        
        assert volunteer.id is not None
        assert volunteer.name == "Charlie"
        assert volunteer.email == "charlie@test.com"

def test_help_request_creation(app):
    """Test creating a help request."""
    with app.app_context():
        request = HelpRequest(
            request_type="groceries",
            latitude=37.75,
            longitude=-122.42
        )
        db.session.add(request)
        db.session.commit()
        
        assert request.id is not None
        assert request.request_type == "groceries"
        assert request.status == "pending"
        assert request.timestamp is not None

def test_help_request_default_status(app):
    """Test help request has default status of pending."""
    with app.app_context():
        request = HelpRequest(
            request_type="medication",
            latitude=37.76,
            longitude=-122.43
        )
        db.session.add(request)
        db.session.commit()
        
        assert request.status == "pending"

def test_query_volunteers(app, sample_volunteers):
    """Test querying volunteers."""
    with app.app_context():
        volunteers = Volunteer.query.all()
        assert len(volunteers) == 2
        assert volunteers[0].name == "Alice"
        assert volunteers[1].name == "Bob"
