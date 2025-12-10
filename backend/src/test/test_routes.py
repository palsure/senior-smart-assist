import pytest
import json

def test_get_requests_empty(client):
    """Test getting requests when database is empty."""
    response = client.get('/api/seniorsmartassist/requests')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)

def test_add_request(client):
    """Test adding a new help request."""
    request_data = {
        'type': 'groceries',
        'lat': 37.7749,
        'lng': -122.4194
    }
    
    response = client.post('/api/seniorsmartassist/request',
                          data=json.dumps(request_data),
                          content_type='application/json')
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'id' in data
    assert data['id'] is not None
    assert data['status'] == 'pending'

def test_add_volunteer(client):
    """Test adding a new volunteer (old endpoint)."""
    volunteer_data = {
        'name': 'Charlie',
        'email': 'charlie@test.com',
        'phone': '555-0003',
        'address': '123 Main St'
    }
    
    response = client.post('/api/seniorsmartassist/volunteer',
                          data=json.dumps(volunteer_data),
                          content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'id' in data
    assert data['id'] is not None

def test_get_volunteers(client, sample_volunteers):
    """Test getting all volunteers."""
    response = client.get('/api/seniorsmartassist/volunteers')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 2
    assert data[0]['name'] == 'Alice'
    assert data[1]['name'] == 'Bob'
    assert 'address' in data[0]
    assert 'address' in data[1]

def test_get_volunteers_empty(client):
    """Test getting volunteers when database is empty."""
    response = client.get('/api/seniorsmartassist/volunteers')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data == []

def test_register_volunteer(client):
    """Test registering a new volunteer using single endpoint."""
    user_data = {
        'name': 'Jane Doe',
        'email': 'jane@example.com',
        'phone': '555-0103',
        'lat': 37.7849,
        'lng': -122.4194
    }
    response = client.post('/api/seniorsmartassist/register/volunteer',
                          data=json.dumps(user_data),
                          content_type='application/json')
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['id'] is not None
    assert data['name'] == 'Jane Doe'
    assert data['email'] == 'jane@example.com'

def test_register_elder(client):
    """Test registering a new elder using single endpoint."""
    user_data = {
        'name': 'Robert Brown',
        'email': 'robert@example.com',
        'phone': '555-0203',
        'address': '789 Pine St',
        'age': 70
    }
    response = client.post('/api/seniorsmartassist/register/elder',
                          data=json.dumps(user_data),
                          content_type='application/json')
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['id'] is not None
    assert data['name'] == 'Robert Brown'
    assert data['email'] == 'robert@example.com'
    if 'age' in data:
        assert data['age'] == 70
def test_login_volunteer(client):
    """Test login for volunteer."""
    user_data = {
        'name': 'Login Volunteer',
        'email': 'loginvol@example.com',
        'phone': '555-0109',
        'lat': 37.7849,
        'lng': -122.4194
    }
    client.post('/api/seniorsmartassist/register/volunteer',
                data=json.dumps(user_data),
                content_type='application/json')
    login_data = {'email': 'loginvol@example.com'}
    response = client.post('/api/seniorsmartassist/login/volunteer',
                          data=json.dumps(login_data),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['email'] == 'loginvol@example.com'
    assert data['type'] == 'volunteer'

def test_login_elder(client):
    """Test login for elder."""
    user_data = {
        'name': 'Login Elder',
        'email': 'logineld@example.com',
        'phone': '555-0209',
        'address': 'Test St',
        'age': 70,
        'lat': 37.7549,
        'lng': -122.4494
    }
    client.post('/api/seniorsmartassist/register/elder',
                data=json.dumps(user_data),
                content_type='application/json')
    login_data = {'email': 'logineld@example.com'}
    response = client.post('/api/seniorsmartassist/login/elder',
                          data=json.dumps(login_data),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['email'] == 'logineld@example.com'
    assert data['type'] == 'elder'

def test_register_invalid_user_type(client):
    """Test registering with invalid user type."""
    user_data = {
        'name': 'Test User',
        'email': 'test@example.com'
    }
    
    response = client.post('/api/seniorsmartassist/register/invalid',
                          data=json.dumps(user_data),
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_register_duplicate_email_volunteer(client):
    """Test registering volunteer with duplicate email."""
    user_data = {
        'name': 'Jane Doe',
        'email': 'jane@example.com',
        'phone': '555-0103',
        'address': '123 Main St'
    }
    
    # First registration
    client.post('/api/seniorsmartassist/register/volunteer',
               data=json.dumps(user_data),
               content_type='application/json')
    
    # Duplicate registration
    response = client.post('/api/seniorsmartassist/register/volunteer',
                          data=json.dumps(user_data),
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'already registered' in data['error']

def test_register_elder_age_validation(client):
    """Test elder registration age validation."""
    # Test elder under 65
    user_data = {
        'name': 'Too Young',
        'email': 'young@example.com',
        'phone': '555-0300',
        'address': '111 Test St',
        'age': 64
    }
    
    response = client.post('/api/seniorsmartassist/register/elder',
                          data=json.dumps(user_data),
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert '65' in data['error']
    
    # Test elder without age
    user_data_no_age = {
        'name': 'No Age',
        'email': 'noage@example.com',
        'phone': '555-0301',
        'address': '222 Test Ave',
        'lat': 37.7749,
        'lng': -122.4194
    }
    
    response = client.post('/api/seniorsmartassist/register/elder',
                          data=json.dumps(user_data_no_age),
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'required' in data['error'].lower()

def test_assign_volunteer_to_request(client):
    """Test assigning a volunteer to a help request."""
    # Create a volunteer
    volunteer_data = {
        'name': 'John Helper',
        'email': 'john@test.com',
        'phone': '555-1111',
        'lat': 37.7749,
        'lng': -122.4194
    }
    vol_response = client.post('/api/seniorsmartassist/register/volunteer',
                               data=json.dumps(volunteer_data),
                               content_type='application/json')
    volunteer_id = json.loads(vol_response.data)['id']
    
    # Create a request
    request_data = {
        'type': 'groceries',
        'lat': 37.7749,
        'lng': -122.4194
    }
    req_response = client.post('/api/seniorsmartassist/request',
                               data=json.dumps(request_data),
                               content_type='application/json')
    request_id = json.loads(req_response.data)['id']
    
    # Assign volunteer
    assign_data = {'volunteer_id': volunteer_id}
    response = client.post(f'/api/seniorsmartassist/request/{request_id}/assign',
                          data=json.dumps(assign_data),
                          content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'assigned'
    assert data['volunteer_id'] == volunteer_id
    assert 'assigned_at' in data

def test_update_request_status(client):
    """Test updating request status."""
    # Create a request
    request_data = {
        'type': 'medication',
        'lat': 37.7749,
        'lng': -122.4194
    }
    req_response = client.post('/api/seniorsmartassist/request',
                               data=json.dumps(request_data),
                               content_type='application/json')
    request_id = json.loads(req_response.data)['id']
    
    # Update status to in_progress
    status_data = {'status': 'in_progress'}
    response = client.put(f'/api/seniorsmartassist/request/{request_id}/status',
                         data=json.dumps(status_data),
                         content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'in_progress'
    
    # Update to completed
    status_data = {'status': 'completed'}
    response = client.put(f'/api/seniorsmartassist/request/{request_id}/status',
                         data=json.dumps(status_data),
                         content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'completed'
    assert 'completed_at' in data

def test_add_contribution(client):
    """Test adding a monetary contribution."""
    contribution_data = {
        'contributor_name': 'John Donor',
        'contributor_email': 'donor@example.com',
        'amount': 50.00,
        'message': 'Thank you for your service!'
    }
    
    response = client.post('/api/seniorsmartassist/contribution',
                          data=json.dumps(contribution_data),
                          content_type='application/json')
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['id'] is not None
    assert data['contributor_name'] == 'John Donor'
    assert data['amount'] == 50.00
    assert 'timestamp' in data

def test_add_contribution_to_volunteer(client):
    """Test adding a contribution designated for a specific volunteer."""
    # Create a volunteer
    volunteer_data = {
        'name': 'Helpful Volunteer',
        'email': 'helpful@test.com',
        'phone': '555-2222',
        'lat': 37.7749,
        'lng': -122.4194
    }
    vol_response = client.post('/api/seniorsmartassist/register/volunteer',
                               data=json.dumps(volunteer_data),
                               content_type='application/json')
    volunteer_id = json.loads(vol_response.data)['id']
    
    # Add contribution for this volunteer
    contribution_data = {
        'contributor_name': 'Grateful Elder',
        'contributor_email': 'grateful@example.com',
        'amount': 25.00,
        'volunteer_id': volunteer_id,
        'message': 'Thank you for helping me!'
    }
    
    response = client.post('/api/seniorsmartassist/contribution',
                          data=json.dumps(contribution_data),
                          content_type='application/json')
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['volunteer_id'] == volunteer_id
    assert data['volunteer_name'] == 'Helpful Volunteer'
    assert data['amount'] == 25.00

def test_get_volunteer_contributions(client):
    """Test getting all contributions for a volunteer."""
    # Create a volunteer
    volunteer_data = {
        'name': 'Star Volunteer',
        'email': 'star@test.com',
        'phone': '555-3333',
        'lat': 37.7749,
        'lng': -122.4194
    }
    vol_response = client.post('/api/seniorsmartassist/register/volunteer',
                               data=json.dumps(volunteer_data),
                               content_type='application/json')
    volunteer_id = json.loads(vol_response.data)['id']
    
    # Add multiple contributions
    client.post('/api/seniorsmartassist/contribution',
               data=json.dumps({
                   'contributor_name': 'Donor 1',
                   'contributor_email': 'donor1@example.com',
                   'amount': 20.00,
                   'volunteer_id': volunteer_id
               }),
               content_type='application/json')
    
    client.post('/api/seniorsmartassist/contribution',
               data=json.dumps({
                   'contributor_name': 'Donor 2',
                   'contributor_email': 'donor2@example.com',
                   'amount': 30.00,
                   'volunteer_id': volunteer_id
               }),
               content_type='application/json')
    
    # Get volunteer contributions
    response = client.get(f'/api/seniorsmartassist/volunteer/{volunteer_id}/contributions')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['volunteer_name'] == 'Star Volunteer'
    assert data['total_contributions'] == 50.00
    assert data['contribution_count'] == 2
    assert len(data['contributions']) == 2

def test_contribution_validation(client):
    """Test contribution validation."""
    # Missing contributor name
    response = client.post('/api/seniorsmartassist/contribution',
                          data=json.dumps({
                              'contributor_email': 'test@example.com',
                              'amount': 10.00
                          }),
                          content_type='application/json')
    assert response.status_code == 400
    
    # Negative amount
    response = client.post('/api/seniorsmartassist/contribution',
                          data=json.dumps({
                              'contributor_name': 'Test',
                              'contributor_email': 'test@example.com',
                              'amount': -5.00
                          }),
                          content_type='application/json')
    assert response.status_code == 400
