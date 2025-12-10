from flask_socketio import SocketIO, emit, join_room, leave_room
from src.main.models import HelpRequest, Volunteer, db
from src.main.utils import smart_match_volunteer

def register_socket_events(socketio: SocketIO):
    """Register WebSocket event handlers."""
    
    @socketio.on('new_request')
    def handle_new_request(data):
        """Handle new help request - create request but don't auto-assign volunteer."""
        from src.main.utils import classify_request_type
        
        # Auto-classify request type from description if not provided
        request_type = data.get('type')
        description = data.get('description', '')
        if not request_type and description:
            request_type = classify_request_type(description)
        elif not request_type:
            request_type = 'Other'
        
        r = HelpRequest(
            request_type=request_type,
            description=description,
            address=data.get('address'),
            elder_id=data.get('elder_id'),
            status='pending'  # Set to pending, waiting for volunteer to accept
        )
        db.session.add(r)
        db.session.commit()

        # Emit request created event (not assigned - volunteers need to accept)
        emit('request_created', {
            'request_id': r.id,
            'request_type': r.request_type,
            'description': r.description,
            'status': r.status
        }, broadcast=True)
    
    @socketio.on('join_chat')
    def handle_join_chat(data):
        """Join a chat room for a specific request."""
        request_id = data.get('request_id')
        if request_id:
            join_room(f'request_{request_id}')
    
    @socketio.on('leave_chat')
    def handle_leave_chat(data):
        """Leave a chat room for a specific request."""
        request_id = data.get('request_id')
        if request_id:
            leave_room(f'request_{request_id}')
