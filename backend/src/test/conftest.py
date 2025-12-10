import pytest
from src.main.app import create_app
from src.main.models import db, Volunteer, Elder, HelpRequest

@pytest.fixture
def app():
    """Create and configure a test app instance."""
    app, socketio = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False
    })
    
    with app.app_context():
        db.create_all()
        # Don't add default volunteers in tests - let tests control the data
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Test CLI runner."""
    return app.test_cli_runner()

@pytest.fixture
def sample_volunteers(app):
    """Create sample volunteers for testing."""
    with app.app_context():
        v1 = Volunteer(name="Alice", email="alice@test.com", phone="555-0001", address="123 Main St")
        v2 = Volunteer(name="Bob", email="bob@test.com", phone="555-0002", address="456 Oak Ave")
        db.session.add_all([v1, v2])
        db.session.commit()
        return [v1, v2]
