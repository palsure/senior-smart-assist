from flask import Blueprint, request, jsonify
from src.main.models import HelpRequest, Volunteer, Elder, Contribution, ChatMessage, Reward, db
from datetime import datetime
from sqlalchemy import or_

bp = Blueprint('api', __name__)

@bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the API is running."""
    return jsonify({
        'status': 'healthy',
        'service': 'SeniorSmartAssist API',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

@bp.route('/register/<user_type>', methods=['POST'])
def register_user(user_type):
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        if user_type == 'elder':
            # Validate required fields
            if not data.get('name'):
                return jsonify({'error': 'Name is required'}), 400
            if not data.get('email'):
                return jsonify({'error': 'Email is required'}), 400
            
            age = data.get('age')
            if age is None:
                return jsonify({'error': 'Age is required for senior citizen registration'}), 400
            if age < 60:
                return jsonify({'error': 'Senior citizen must be 60 years or older'}), 400
            
            # Check if email already exists
            existing_elder = Elder.query.filter_by(email=data['email']).first()
            if existing_elder:
                return jsonify({'error': 'Email already registered'}), 400
            
            elder = Elder(
                name=data['name'],
                email=data['email'],
                phone=data.get('phone'),
                address=data.get('address'),
                age=age
            )
            db.session.add(elder)
            db.session.commit()
            return jsonify({'id': elder.id, 'name': elder.name, 'email': elder.email, 'age': elder.age}), 201
        elif user_type == 'volunteer':
            # Validate required fields
            if not data.get('name'):
                return jsonify({'error': 'Name is required'}), 400
            if not data.get('email'):
                return jsonify({'error': 'Email is required'}), 400
            
            # Check if email already exists
            existing_volunteer = Volunteer.query.filter_by(email=data['email']).first()
            if existing_volunteer:
                return jsonify({'error': 'Email already registered'}), 400
            
            volunteer = Volunteer(
                name=data['name'],
                email=data['email'],
                phone=data.get('phone'),
                address=data.get('address'),
                skills=data.get('skills'),
                gender=data.get('gender'),
                has_car=data.get('has_car', False),
                availability=data.get('availability', 'available')
            )
            db.session.add(volunteer)
            db.session.commit()
            return jsonify({'id': volunteer.id, 'name': volunteer.name, 'email': volunteer.email}), 201
        else:
            return jsonify({'error': 'Invalid user type'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500
    
@bp.route('/login/<user_type>', methods=['POST'])
def login_user(user_type):
    """Login endpoint for elder and volunteer. Accepts email or phone number as username."""
    data = request.json
    username = data.get('username')
    
    if not username:
        return jsonify({'error': 'Email or phone number is required'}), 400
    
    # For demo, password is not checked (add password logic if needed)
    if user_type == 'elder':
        # Search by email or phone
        user = Elder.query.filter(
            or_(Elder.email == username, Elder.phone == username)
        ).first()
    elif user_type == 'volunteer':
        # Search by email or phone
        user = Volunteer.query.filter(
            or_(Volunteer.email == username, Volunteer.phone == username)
        ).first()
    else:
        return jsonify({'error': 'Invalid user type'}), 400
    
    if not user:
        return jsonify({'error': 'Account not found. Please create account.'}), 404
    
    # Return user info and type
    user_data = {c.name: getattr(user, c.name) for c in user.__table__.columns}
    user_data['type'] = user_type
    return jsonify(user_data)

@bp.route('/requests', methods=['GET'])
def get_requests():
    """Get all help requests."""
    from src.main.utils import calculate_distance_miles
    
    # Get optional volunteer_id from query parameter (for distance calculation)
    volunteer_id_param = request.args.get('volunteer_id', type=int)
    current_volunteer = None
    if volunteer_id_param:
        current_volunteer = Volunteer.query.get(volunteer_id_param)
    
    reqs = HelpRequest.query.order_by(HelpRequest.timestamp.desc()).all()
    result = []
    for r in reqs:
        # Calculate priority for existing requests
        priority = calculate_request_priority(r.description or '')
        request_data = {
            'id': r.id,
            'type': r.request_type,
            'request_type': r.request_type,
            'description': r.description,
            'status': r.status,
            'address': r.address,
            'elder_id': r.elder_id,
            'volunteer_id': r.volunteer_id,
            'priority': priority,
            'timestamp': r.timestamp.isoformat() if r.timestamp else None,
            'assigned_at': r.assigned_at.isoformat() if r.assigned_at else None,
            'completed_at': r.completed_at.isoformat() if r.completed_at else None,
            'rating': getattr(r, 'rating', None),
            'rating_comment': getattr(r, 'rating_comment', None)
        }
        # Include volunteer information if assigned
        if r.volunteer_id and r.volunteer:
            request_data['volunteer_name'] = r.volunteer.name
            request_data['volunteer_gender'] = getattr(r.volunteer, 'gender', None)
        # Include elder information
        if r.elder_id and r.elder:
            request_data['elder_name'] = r.elder.name
        
        # Include reward information if request is completed
        if r.status == 'completed' and r.volunteer_id:
            reward = Reward.query.filter_by(request_id=r.id).first()
            if reward:
                request_data['reward_amount'] = reward.amount
            else:
                request_data['reward_amount'] = None
        
        # Calculate distance ONLY for pending requests when volunteer is viewing available requests
        # This is needed for distance filtering. Skip distance calculation for:
        # - Elders viewing their requests (not needed)
        # - Volunteers viewing "My Requests" (already assigned, distance not needed)
        # - Assigned requests (distance already known or not relevant)
        distance = None
        if r.status == 'pending' and current_volunteer and current_volunteer.address:
            # Only calculate distance for pending requests when volunteer_id is provided
            # This means a volunteer is viewing available requests and needs distance for filtering
            if r.elder_id and r.elder:
                elder_address = r.address or r.elder.address
                if elder_address:
                    try:
                        distance = calculate_distance_miles(elder_address, current_volunteer.address)
                        # Don't include request if distance is more than 100 miles
                        if distance and distance > 100:
                            continue  # Skip this request, don't add it to result
                    except Exception as e:
                        print(f"Distance calculation skipped for request {r.id}: {e}")
                        # If distance calculation fails, don't show the request to be safe
                        continue
        
        request_data['distance_miles'] = distance
        result.append(request_data)
    return jsonify(result)

@bp.route('/classify-request', methods=['POST'])
def classify_request():
    """AI endpoint to classify request type from description."""
    data = request.json
    description = data.get('description', '')
    
    from src.main.utils import classify_request_type
    request_type = classify_request_type(description)
    
    return jsonify({
        'request_type': request_type,
        'description': description
    }), 200

@bp.route('/request', methods=['POST'])
def add_request():
    """Create a new help request."""
    data = request.json
    # If type is provided, use it; otherwise classify from description
    request_type = data.get('type')
    description = data.get('description', '')
    if not request_type and description:
        from src.main.utils import classify_request_type
        request_type = classify_request_type(description)
    
    # Calculate priority based on description keywords
    priority = calculate_request_priority(description)
    
    r = HelpRequest(
        elder_id=data.get('elder_id'),
        request_type=request_type or 'Other',
        description=description,
        address=data.get('address'),
        status='pending'  # Set to pending, waiting for volunteer to accept
    )
    db.session.add(r)
    db.session.commit()
    
    return jsonify({
        'id': r.id,
        'status': r.status,
        'request_type': r.request_type,
        'description': r.description,
        'priority': priority
    }), 201

def calculate_reward_amount(request: HelpRequest) -> float:
    """Calculate reward amount based on request complexity.
    
    Args:
        request: HelpRequest object
        
    Returns:
        Reward amount in dollars
    """
    # Base reward by priority
    priority = calculate_request_priority(request.description or '')
    priority_rewards = {
        'Urgent': 50.0,
        'High': 30.0,
        'Medium': 20.0,
        'Normal': 10.0
    }
    base_reward = priority_rewards.get(priority, 10.0)
    
    # Adjust by request type complexity
    request_type = request.request_type or 'Other'
    type_multipliers = {
        'Medical Assistance': 1.5,  # More complex
        'Transportation': 1.2,
        'Home Maintenance': 1.3,
        'House Shifting': 1.4,
        'Technology Help': 1.1,
        'Groceries': 1.0,
        'Commute Assistance': 1.0,
        'Companionship': 0.9,
        'Other': 1.0
    }
    multiplier = type_multipliers.get(request_type, 1.0)
    
    reward_amount = base_reward * multiplier
    return round(reward_amount, 2)

@bp.route('/contributions/balance', methods=['GET'])
def get_donation_balance():
    """Get total donation balance (contributions without specific volunteer assignment)."""
    # Sum all contributions that are not assigned to a specific volunteer
    general_contributions = Contribution.query.filter_by(volunteer_id=None).all()
    total_balance = sum(c.amount for c in general_contributions)
    
    # Also subtract rewards already given
    total_rewards = sum(r.amount for r in Reward.query.all())
    available_balance = total_balance - total_rewards
    
    return jsonify({
        'total_donations': round(total_balance, 2),
        'total_rewards_given': round(total_rewards, 2),
        'available_balance': round(max(0, available_balance), 2)  # Don't go negative
    }), 200

@bp.route('/request/<int:request_id>/accept', methods=['POST'])
def accept_request(request_id):
    """Allow a volunteer to accept a pending request."""
    from datetime import datetime
    
    data = request.json
    volunteer_id = data.get('volunteer_id')
    
    if not volunteer_id:
        return jsonify({'error': 'Volunteer ID is required'}), 400
    
    help_request = HelpRequest.query.get(request_id)
    if not help_request:
        return jsonify({'error': 'Request not found'}), 404
    
    if help_request.status != 'pending':
        return jsonify({'error': 'Request is not available for assignment'}), 400
    
    # Assign volunteer to request (rewards will be assigned when request is completed)
    help_request.volunteer_id = volunteer_id
    help_request.status = 'assigned'
    help_request.assigned_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'id': help_request.id,
        'status': help_request.status,
        'volunteer_id': help_request.volunteer_id
    }), 200

def calculate_request_priority(description: str) -> str:
    """Calculate request priority based on description keywords."""
    if not description:
        return 'Normal'
    
    desc_lower = description.lower()
    
    # High priority keywords (urgent/emergency situations)
    high_priority_keywords = ['urgent', 'emergency', 'asap', 'as soon as possible', 'immediately', 
                             'critical', 'need help now', 'quickly', 'right away', 'right now',
                             'urgently', 'immediate']
    
    # Medium priority keywords (time-sensitive but not emergency)
    medium_priority_keywords = ['soon', 'today', 'needed', 'please help', 'as soon as',
                               'when possible', 'need assistance']
    
    # Check for high priority first (most critical)
    if any(keyword in desc_lower for keyword in high_priority_keywords):
        return 'High'
    
    # Check for medium priority
    if any(keyword in desc_lower for keyword in medium_priority_keywords):
        return 'Medium'
    
    return 'Normal'

@bp.route('/request/<int:request_id>/assign', methods=['POST'])
def assign_volunteer(request_id):
    """Assign a volunteer to a help request. If no volunteer_id provided, uses smart matching."""
    data = request.json
    volunteer_id = data.get('volunteer_id')
    
    help_request = HelpRequest.query.get(request_id)
    if not help_request:
        return jsonify({'error': 'Request not found'}), 404
    
    # If no volunteer_id provided, use smart matching
    if not volunteer_id:
        from src.main.utils import smart_match_volunteer
        volunteers = Volunteer.query.all()
        match_result = smart_match_volunteer(help_request, volunteers)
        
        if not match_result:
            return jsonify({'error': 'No suitable volunteer found'}), 404
        
        best_volunteer, score, breakdown = match_result
        volunteer_id = best_volunteer.id
    else:
        volunteer = Volunteer.query.get(volunteer_id)
        if not volunteer:
            return jsonify({'error': 'Volunteer not found'}), 404
    
    help_request.volunteer_id = volunteer_id
    help_request.status = 'assigned'
    help_request.assigned_at = datetime.utcnow()
    
    db.session.commit()
    
    volunteer = Volunteer.query.get(volunteer_id)
    return jsonify({
        'id': help_request.id,
        'status': help_request.status,
        'volunteer_id': help_request.volunteer_id,
        'volunteer_name': volunteer.name,
        'assigned_at': help_request.assigned_at.isoformat()
    }), 200

@bp.route('/request/<int:request_id>/smart-match', methods=['POST'])
def smart_match_request(request_id):
    """Find the best matching volunteer for a request using AI-like smart matching."""
    help_request = HelpRequest.query.get(request_id)
    if not help_request:
        return jsonify({'error': 'Request not found'}), 404
    
    from src.main.utils import smart_match_volunteer
    volunteers = Volunteer.query.all()
    match_result = smart_match_volunteer(help_request, volunteers)
    
    if not match_result:
        return jsonify({'error': 'No suitable volunteer found'}), 404
    
    best_volunteer, score, breakdown = match_result
    
    return jsonify({
        'volunteer_id': best_volunteer.id,
        'volunteer_name': best_volunteer.name,
        'volunteer_email': best_volunteer.email,
        'volunteer_phone': best_volunteer.phone,
        'volunteer_address': best_volunteer.address,
        'match_score': round(score, 3),
        'match_breakdown': breakdown
    }), 200

@bp.route('/request/<int:request_id>', methods=['PUT'])
def update_request(request_id):
    """Update request details (description, type, address)."""
    data = request.json
    if not data:
        return jsonify({'error': 'Request body cannot be empty'}), 400
    
    help_request = HelpRequest.query.get(request_id)
    if not help_request:
        return jsonify({'error': 'Request not found'}), 404
    
    # Cannot update cancelled or completed requests
    if help_request.status in ['cancelled', 'completed']:
        return jsonify({'error': 'Cannot update cancelled or completed requests'}), 400
    
    # Update description if provided
    if 'description' in data:
        description = data.get('description', '').strip()
        if not description:
            return jsonify({'error': 'Description cannot be empty'}), 400
        help_request.description = description
        # Reclassify request type if description changed and type not explicitly provided
        if 'type' not in data:
            from src.main.utils import classify_request_type
            help_request.request_type = classify_request_type(description)
    
    # Update address if provided
    if 'address' in data:
        help_request.address = data.get('address', '').strip() or None
    
    # Update request type if explicitly provided
    if 'type' in data:
        request_type = data.get('type', '').strip()
        if request_type:
            help_request.request_type = request_type
    
    # Priority is calculated from description, but can be overridden
    # If priority is provided, we'll use it; otherwise calculate from description
    priority = None
    if 'priority' in data:
        priority = data.get('priority', '').strip()
        if priority not in ['Urgent', 'High', 'Medium', 'Normal']:
            return jsonify({'error': 'Priority must be Urgent, High, Medium, or Normal'}), 400
    else:
        # Calculate priority from description if not provided
        priority = calculate_request_priority(help_request.description or '')
    
    try:
        db.session.commit()
        
        # Use provided priority or calculated one
        final_priority = priority if priority else calculate_request_priority(help_request.description or '')
        
        return jsonify({
            'id': help_request.id,
            'description': help_request.description,
            'request_type': help_request.request_type,
            'address': help_request.address,
            'priority': final_priority,
            'status': help_request.status,
            'timestamp': help_request.timestamp.isoformat() if help_request.timestamp else None
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update request: {str(e)}'}), 500

@bp.route('/request/<int:request_id>/status', methods=['PUT'])
def update_request_status(request_id):
    """Update the status of a help request."""
    data = request.json
    new_status = data.get('status')
    wants_reward = data.get('wants_reward', False)  # Check if volunteer wants reward when completing
    
    valid_statuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled']
    if not new_status or new_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
    
    help_request = HelpRequest.query.get(request_id)
    if not help_request:
        return jsonify({'error': 'Request not found'}), 404
    
    reward_amount = 0.0
    reward_assigned = False
    
    # If completing the request and volunteer wants reward, assign it now
    if new_status == 'completed' and wants_reward and help_request.volunteer_id:
        reward_amount = calculate_reward_amount(help_request)
        
        # Check if we have enough balance
        general_contributions = Contribution.query.filter_by(volunteer_id=None).all()
        total_balance = sum(c.amount for c in general_contributions)
        total_rewards = sum(r.amount for r in Reward.query.all())
        available_balance = total_balance - total_rewards
        
        # Check if reward already exists for this request
        existing_reward = Reward.query.filter_by(request_id=request_id).first()
        
        if not existing_reward and available_balance >= reward_amount:
            # Create reward record
            reward = Reward(
                request_id=request_id,
                volunteer_id=help_request.volunteer_id,
                amount=reward_amount
            )
            db.session.add(reward)
            reward_assigned = True
        elif existing_reward:
            # Reward already exists
            reward_amount = existing_reward.amount
            reward_assigned = True
    
    help_request.status = new_status
    
    # If releasing (setting to pending), clear volunteer assignment
    if new_status == 'pending':
        help_request.volunteer_id = None
        help_request.assigned_at = None
    
    if new_status == 'completed':
        help_request.completed_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'id': help_request.id,
        'status': help_request.status,
        'completed_at': help_request.completed_at.isoformat() if help_request.completed_at else None,
        'reward_amount': reward_amount,
        'reward_assigned': reward_assigned
    }), 200

@bp.route('/volunteer', methods=['POST'])
def add_volunteer():
    """Add a new volunteer (legacy endpoint - kept for backward compatibility)."""
    data = request.json
    v = Volunteer(
        name=data['name'],
        email=data['email'],
        phone=data.get('phone'),
        address=data.get('address')
    )
    db.session.add(v)
    db.session.commit()
    return jsonify({'id': v.id})

@bp.route('/volunteers', methods=['GET'])
def get_volunteers():
    """Get all volunteers."""
    volunteers = Volunteer.query.all()
    return jsonify([{
        'id': v.id, 'name': v.name,
        'address': v.address,
        'skills': v.skills,
        'availability': v.availability
    } for v in volunteers])


@bp.route('/elder/<int:elder_id>', methods=['PUT'])
def update_elder(elder_id):
    """Update senior citizen profile."""
    data = request.json
    elder = Elder.query.get(elder_id)
    if not elder:
        return jsonify({'error': 'Senior citizen not found'}), 404
    
    elder.name = data.get('name', elder.name)
    elder.email = data.get('email', elder.email)
    elder.phone = data.get('phone', elder.phone)
    elder.address = data.get('address', elder.address)
    if 'age' in data:
        age = data['age']
        if age < 60:
            return jsonify({'error': 'Age must be 60 or older'}), 400
        elder.age = age
    
    db.session.commit()
    
    user_data = {c.name: getattr(elder, c.name) for c in elder.__table__.columns}
    return jsonify(user_data), 200

@bp.route('/volunteer/<int:volunteer_id>', methods=['PUT'])
def update_volunteer(volunteer_id):
    """Update volunteer profile."""
    data = request.json
    volunteer = Volunteer.query.get(volunteer_id)
    if not volunteer:
        return jsonify({'error': 'Volunteer not found'}), 404
    
    volunteer.name = data.get('name', volunteer.name)
    volunteer.email = data.get('email', volunteer.email)
    volunteer.phone = data.get('phone', volunteer.phone)
    volunteer.address = data.get('address', volunteer.address)
    volunteer.skills = data.get('skills', volunteer.skills)
    volunteer.availability = data.get('availability', volunteer.availability)
    
    db.session.commit()
    
    user_data = {c.name: getattr(volunteer, c.name) for c in volunteer.__table__.columns}
    return jsonify(user_data), 200

@bp.route('/elders', methods=['GET'])
def get_elders():
    """Get all registered senior citizens."""
    elders = Elder.query.all()
    return jsonify([{
        'id': e.id,
        'name': e.name,
        'email': e.email,
        'phone': e.phone,
        'address': e.address,
        'age': e.age
    } for e in elders])

@bp.route('/elder/<int:elder_id>/requests', methods=['GET'])
def get_elder_requests(elder_id):
    """Get all requests for a specific senior citizen."""
    elder = Elder.query.get(elder_id)
    if not elder:
        return jsonify({'error': 'Senior citizen not found'}), 404
    
    requests = HelpRequest.query.filter_by(elder_id=elder_id).all()
    return jsonify([{
        'id': r.id,
        'type': r.request_type,
        'request_type': r.request_type,
        'description': r.description,
        'status': r.status,
        'address': r.address,
        'volunteer_id': r.volunteer_id,
        'timestamp': r.timestamp.isoformat() if r.timestamp else None,
        'assigned_at': r.assigned_at.isoformat() if r.assigned_at else None,
        'completed_at': r.completed_at.isoformat() if r.completed_at else None
    } for r in requests])

@bp.route('/volunteer/<int:volunteer_id>/requests', methods=['GET'])
def get_volunteer_requests(volunteer_id):
    """Get all assigned requests for a specific volunteer."""
    volunteer = Volunteer.query.get(volunteer_id)
    if not volunteer:
        return jsonify({'error': 'Volunteer not found'}), 404
    
    requests = HelpRequest.query.filter_by(volunteer_id=volunteer_id).all()
    return jsonify([{
        'id': r.id,
        'type': r.request_type,
        'request_type': r.request_type,
        'description': r.description,
        'status': r.status,
        'address': r.address,
        'elder_id': r.elder_id,
        'timestamp': r.timestamp.isoformat() if r.timestamp else None,
        'assigned_at': r.assigned_at.isoformat() if r.assigned_at else None,
        'completed_at': r.completed_at.isoformat() if r.completed_at else None,
        'rating': getattr(r, 'rating', None),
        'rating_comment': getattr(r, 'rating_comment', None),
        'elder_name': r.elder.name if r.elder else None
    } for r in requests])

@bp.route('/volunteer/<int:volunteer_id>/ratings', methods=['GET'])
def get_volunteer_ratings(volunteer_id):
    """Get all ratings and feedback for a volunteer."""
    volunteer = Volunteer.query.get(volunteer_id)
    if not volunteer:
        return jsonify({'error': 'Volunteer not found'}), 404
    
    # Get all completed requests with ratings
    completed_requests = HelpRequest.query.filter_by(
        volunteer_id=volunteer_id,
        status='completed'
    ).all()
    
    ratings = []
    total_rating = 0
    rating_count = 0
    
    for r in completed_requests:
        rating = getattr(r, 'rating', None)
        if rating:
            ratings.append({
                'request_id': r.id,
                'request_type': r.request_type,
                'description': r.description,
                'rating': rating,
                'rating_comment': getattr(r, 'rating_comment', None),
                'elder_name': r.elder.name if r.elder else 'Senior Citizen',
                'completed_at': r.completed_at.isoformat() if r.completed_at else None,
                'timestamp': r.timestamp.isoformat() if r.timestamp else None
            })
            total_rating += rating
            rating_count += 1
    
    # Calculate overall rating
    overall_rating = round(total_rating / rating_count, 2) if rating_count > 0 else None
    
    # Calculate total rewards - only from completed requests
    rewards = Reward.query.filter_by(volunteer_id=volunteer_id).all()
    total_rewards = 0.0
    for reward in rewards:
        # Only count rewards for completed requests
        request = HelpRequest.query.get(reward.request_id)
        if request and request.status == 'completed':
            total_rewards += reward.amount
    
    return jsonify({
        'volunteer_id': volunteer_id,
        'volunteer_name': volunteer.name,
        'overall_rating': overall_rating,
        'total_ratings': rating_count,
        'total_rewards': round(total_rewards, 2),
        'ratings': ratings
    }), 200

@bp.route('/contribution', methods=['POST'])
def add_contribution():
    """Add a monetary contribution to reward volunteers."""
    data = request.json
    
    # Validate required fields
    if not data.get('contributor_name'):
        return jsonify({'error': 'Contributor name is required'}), 400
    if not data.get('contributor_email'):
        return jsonify({'error': 'Contributor email is required'}), 400
    if not data.get('amount'):
        return jsonify({'error': 'Amount is required'}), 400
    
    amount = float(data['amount'])
    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than zero'}), 400
    
    # Validate volunteer if specified
    volunteer_id = data.get('volunteer_id')
    if volunteer_id:
        volunteer = Volunteer.query.get(volunteer_id)
        if not volunteer:
            return jsonify({'error': 'Volunteer not found'}), 404
    
    contribution = Contribution(
        contributor_name=data['contributor_name'],
        contributor_email=data['contributor_email'],
        amount=amount,
        volunteer_id=volunteer_id,
        message=data.get('message')
    )
    
    db.session.add(contribution)
    db.session.commit()
    
    response_data = {
        'id': contribution.id,
        'contributor_name': contribution.contributor_name,
        'amount': contribution.amount,
        'timestamp': contribution.timestamp.isoformat()
    }
    
    if volunteer_id:
        response_data['volunteer_id'] = volunteer_id
        response_data['volunteer_name'] = volunteer.name
    
    return jsonify(response_data), 201

@bp.route('/contributions', methods=['GET'])
def get_contributions():
    """Get all contributions."""
    contributions = Contribution.query.order_by(Contribution.timestamp.desc()).all()
    return jsonify([{
        'id': c.id,
        'contributor_name': c.contributor_name,
        'contributor_email': c.contributor_email,
        'amount': c.amount,
        'volunteer_id': c.volunteer_id,
        'volunteer_name': c.volunteer.name if c.volunteer else None,
        'message': c.message,
        'timestamp': c.timestamp.isoformat()
    } for c in contributions])

@bp.route('/volunteer/<int:volunteer_id>/contributions', methods=['GET'])
def get_volunteer_contributions(volunteer_id):
    """Get all contributions for a specific volunteer."""
    volunteer = Volunteer.query.get(volunteer_id)
    if not volunteer:
        return jsonify({'error': 'Volunteer not found'}), 404
    
    contributions = Contribution.query.filter_by(volunteer_id=volunteer_id).order_by(Contribution.timestamp.desc()).all()
    total = sum(c.amount for c in contributions)
    
    return jsonify({
        'volunteer_id': volunteer_id,
        'volunteer_name': volunteer.name,
        'total_contributions': total,
        'contribution_count': len(contributions),
        'contributions': [{
            'id': c.id,
            'contributor_name': c.contributor_name,
            'amount': c.amount,
            'message': c.message,
            'timestamp': c.timestamp.isoformat()
        } for c in contributions]
    }), 200

@bp.route('/chat/<int:request_id>/messages', methods=['GET'])
def get_chat_messages(request_id):
    """Get all chat messages for a specific request."""
    help_request = HelpRequest.query.get(request_id)
    if not help_request:
        return jsonify({'error': 'Request not found'}), 404
    
    messages = ChatMessage.query.filter_by(request_id=request_id).order_by(ChatMessage.timestamp.asc()).all()
    return jsonify([{
        'id': m.id,
        'request_id': m.request_id,
        'sender_id': m.sender_id,
        'sender_type': m.sender_type,
        'message': m.message,
        'timestamp': m.timestamp.isoformat() if m.timestamp else None
    } for m in messages]), 200

@bp.route('/chat/<int:request_id>/send', methods=['POST'])
def send_chat_message(request_id):
    """Send a chat message for a specific request."""
    data = request.json
    if not data:
        return jsonify({'error': 'Request body cannot be empty'}), 400
    
    help_request = HelpRequest.query.get(request_id)
    if not help_request:
        return jsonify({'error': 'Request not found'}), 404
    
    sender_id = data.get('sender_id')
    sender_type = data.get('sender_type')
    message = data.get('message', '').strip()
    
    if not sender_id or not sender_type:
        return jsonify({'error': 'sender_id and sender_type are required'}), 400
    
    if sender_type not in ['elder', 'volunteer']:
        return jsonify({'error': 'sender_type must be "elder" or "volunteer"'}), 400
    
    if not message:
        return jsonify({'error': 'Message cannot be empty'}), 400
    
    # Verify sender is associated with the request
    if sender_type == 'elder' and help_request.elder_id != sender_id:
        return jsonify({'error': 'Elder ID does not match request'}), 403
    if sender_type == 'volunteer' and help_request.volunteer_id != sender_id:
        return jsonify({'error': 'Volunteer ID does not match request'}), 403
    
    chat_message = ChatMessage(
        request_id=request_id,
        sender_id=sender_id,
        sender_type=sender_type,
        message=message
    )
    
    try:
        db.session.add(chat_message)
        db.session.commit()
        
        # Emit WebSocket event for real-time chat
        try:
            from flask import current_app
            socketio = current_app.extensions.get('socketio')
            if socketio:
                socketio.emit('new_message', {
                    'id': chat_message.id,
                    'request_id': chat_message.request_id,
                    'sender_id': chat_message.sender_id,
                    'sender_type': chat_message.sender_type,
                    'message': chat_message.message,
                    'timestamp': chat_message.timestamp.isoformat() if chat_message.timestamp else None
                }, room=f'request_{request_id}', namespace='/')
        except Exception as ws_error:
            # If WebSocket emit fails, message is still saved
            print(f"WebSocket emit error: {ws_error}")
        
        return jsonify({
            'id': chat_message.id,
            'request_id': chat_message.request_id,
            'sender_id': chat_message.sender_id,
            'sender_type': chat_message.sender_type,
            'message': chat_message.message,
            'timestamp': chat_message.timestamp.isoformat() if chat_message.timestamp else None
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to send message: {str(e)}'}), 500

@bp.route('/request/<int:request_id>/rate', methods=['POST'])
def rate_volunteer(request_id):
    """Rate a volunteer for a completed request."""
    from src.main.models import HelpRequest, db
    
    data = request.json
    if not data:
        return jsonify({'error': 'Request body cannot be empty'}), 400
    
    rating = data.get('rating')
    rating_comment = data.get('rating_comment', '').strip()
    
    if not rating:
        return jsonify({'error': 'Rating is required'}), 400
    
    try:
        rating = int(rating)
        if rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Rating must be a number between 1 and 5'}), 400
    
    help_request = HelpRequest.query.get(request_id)
    if not help_request:
        return jsonify({'error': 'Request not found'}), 404
    
    if help_request.status != 'completed':
        return jsonify({'error': 'Can only rate completed requests'}), 400
    
    if not help_request.volunteer_id:
        return jsonify({'error': 'Request has no assigned volunteer'}), 400
    
    # Update rating
    help_request.rating = rating
    help_request.rating_comment = rating_comment if rating_comment else None
    
    try:
        db.session.commit()
        return jsonify({
            'id': help_request.id,
            'rating': help_request.rating,
            'rating_comment': help_request.rating_comment
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to save rating: {str(e)}'}), 500
