# SeniorSmartAssist Backend

Flask-based REST API and WebSocket server for the SeniorSmartAssist platform. Provides real-time communication, AI-powered request classification, smart volunteer matching, and comprehensive request management.

## Features

- 🚀 **Real-time WebSocket Communication**: Instant notifications and chat via Socket.IO
- 📍 **Geolocation-based Matching**: Distance calculation and volunteer matching using geocoding
- 🧠 **AI-Powered Classification**: Automatic request type classification from descriptions
- 💰 **Rewards System**: Automatic reward calculation and assignment based on request complexity
- ⭐ **Rating System**: 5-star rating system with comments for volunteer feedback
- 💬 **Real-time Chat**: WebSocket-based chat between elders and volunteers
- 🗄️ **Database Support**: SQLite (development) and PostgreSQL (production)
- 🔄 **RESTful API**: Comprehensive REST API for all operations
- 🧪 **Test Coverage**: Comprehensive unit tests with pytest

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── __init__.py
│   │   ├── app.py          # Application factory and configuration
│   │   ├── models.py       # Database models (HelpRequest, Volunteer)
│   │   ├── routes.py       # REST API endpoints
│   │   ├── events.py       # WebSocket event handlers
│   │   └── utils.py        # Utility functions (distance, ETA)
│   └── test/
│       ├── __init__.py
│       ├── conftest.py     # Test fixtures and configuration
│       ├── test_models.py  # Model tests
│       ├── test_routes.py  # API endpoint tests
│       └── test_utils.py   # Utility function tests
├── run.py                  # Server entry point
├── pytest.ini              # Test configuration
├── requirements.txt
├── Dockerfile
├── .env                    # Environment variables (create from .env.example)
├── .env.example
├── .gitignore
└── README.md
```

## Installation

### Prerequisites

- Python 3.10+
- pip
- Virtual environment tool (venv)

### Setup

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database configuration
   ```

## Configuration

### Database Configuration

The application supports both SQLite and PostgreSQL databases.

**SQLite (Development)**
```env
DATABASE_URL=sqlite:///seniorsmartassist.db
```

**PostgreSQL (Production)**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/seniorsmartassist
```

### Setting up PostgreSQL

1. Install PostgreSQL
2. Create database:
   ```bash
   createdb seniorsmartassist
   ```
3. Update `.env` with your PostgreSQL credentials

## Running the Application

### Development Server

```bash
cd backend
python run.py
```

The server will start on `http://0.0.0.0:5000`

**Sample Data**: On first run, the application automatically loads sample data:
- 5 volunteers: Alice Chen, Bob Martinez, Carol Johnson, David Kim, Emma Wilson
- 5 senior citizens: Mary Johnson, John Smith, Patricia Brown, Robert Davis, Linda Garcia

Sample data is only loaded if the database is empty and not in testing mode.

### Production Deployment

For production, use a WSGI server like Gunicorn:

```bash
pip install gunicorn
gunicorn -k eventlet -w 1 --bind 0.0.0.0:5000 src.main.app:create_app
```

## API Documentation

### Postman Collection

A complete Postman collection is available for testing the API:
- **Collection:** `SeniorSmartAssist_API.postman_collection.json`
- **Environment:** `SeniorSmartAssist_Local.postman_environment.json`

**Import Instructions:**
1. Open Postman
2. Click **Import** → Select the collection and environment files
3. Select the "SeniorSmartAssist Local" environment
4. Start making requests!

### REST Endpoints

#### Get All Requests
```http
GET /api/seniorsmartassist/requests
```
Returns all help requests.

**Response:**
```json
[
  {
    "id": 1,
    "type": "groceries",
    "status": "pending",
    "lat": 37.7749,
    "lng": -122.4194
  }
]
```

#### Add Help Request
```http
POST /api/seniorsmartassist/request
Content-Type: application/json

{
  "type": "groceries",
  "lat": 37.7749,
  "lng": -122.4194
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "status": "pending"
}
```

#### Assign Volunteer to Request
```http
POST /api/seniorsmartassist/request/{id}/assign
Content-Type: application/json

{
  "volunteer_id": 1
}
```

Assigns a volunteer to a specific help request. Updates status to `assigned` and records assignment timestamp.

**Response (200 OK):**
```json
{
  "id": 1,
  "status": "assigned",
  "volunteer_id": 1,
  "volunteer_name": "Alice Chen",
  "assigned_at": "2025-01-18T20:00:00"
}
```

**Error Responses:**
- `404 Not Found` - Request or volunteer not found
- `400 Bad Request` - Missing volunteer_id

#### Update Request Status
```http
PUT /api/seniorsmartassist/request/{id}/status
Content-Type: application/json

{
  "status": "in_progress"
}
```

Updates the status of a help request. Automatically sets `completed_at` timestamp when status is changed to `completed`.

**Valid Status Values:**
- `pending` - Request created, awaiting assignment
- `assigned` - Volunteer assigned to request
- `in_progress` - Volunteer is actively working on request
- `completed` - Request has been fulfilled
- `cancelled` - Request was cancelled

**Response (200 OK):**
```json
{
  "id": 1,
  "status": "completed",
  "completed_at": "2025-01-18T21:00:00"
}
```

**Error Responses:**
- `404 Not Found` - Request not found
- `400 Bad Request` - Invalid status value or missing status

#### Get Elder Requests
```http
GET /api/seniorsmartassist/elder/{id}/requests
```

Retrieves all help requests for a specific senior citizen, including status and assigned volunteer information.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "elder_id": 1,
    "volunteer_id": 2,
    "request_type": "groceries",
    "status": "completed",
    "lat": 37.7649,
    "lng": -122.4294,
    "timestamp": "2025-01-18T10:00:00",
    "assigned_at": "2025-01-18T10:05:00",
    "completed_at": "2025-01-18T11:30:00"
  }
]
```

**Error Responses:**
- `404 Not Found` - Senior citizen not found

#### Get Volunteer Requests
```http
GET /api/seniorsmartassist/volunteer/{id}/requests
```

Retrieves all assigned requests for a specific volunteer, showing active and completed assignments.

**Response (200 OK):**
```json
[
  {
    "id": 2,
    "elder_id": 3,
    "volunteer_id": 1,
    "request_type": "medication",
    "status": "in_progress",
    "lat": 37.7749,
    "lng": -122.4194,
    "timestamp": "2025-01-18T14:00:00",
    "assigned_at": "2025-01-18T14:10:00",
    "completed_at": null
  }
]
```

**Error Responses:**
- `404 Not Found` - Volunteer not found

#### Add Contribution
```http
POST /api/seniorsmartassist/contribution
Content-Type: application/json

{
  "contributor_name": "John Donor",
  "contributor_email": "john.donor@example.com",
  "amount": 50.00,
  "message": "Thank you for your service!"
}
```

Allows anyone to contribute money that can be used to reward volunteers. Contributions can be general donations or designated for a specific volunteer.

**Optional Fields:**
- `volunteer_id` - Designate contribution for a specific volunteer
- `message` - Personal message from the contributor

**Response (201 Created):**
```json
{
  "id": 1,
  "contributor_name": "John Donor",
  "amount": 50.00,
  "timestamp": "2025-11-18T20:00:00"
}
```

**With Volunteer Designation:**
```json
{
  "id": 2,
  "contributor_name": "Grateful Elder",
  "amount": 25.00,
  "volunteer_id": 1,
  "volunteer_name": "Alice Chen",
  "timestamp": "2025-11-18T20:30:00"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid amount
- `404 Not Found` - Volunteer not found (when volunteer_id specified)

#### Get All Contributions
```http
GET /api/seniorsmartassist/contributions
```

Retrieves all contributions in the system.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "contributor_name": "John Donor",
    "contributor_email": "john.donor@example.com",
    "amount": 50.00,
    "volunteer_id": null,
    "volunteer_name": null,
    "message": "Keep up the great work!",
    "timestamp": "2025-11-18T20:00:00"
  },
  {
    "id": 2,
    "contributor_name": "Grateful Elder",
    "contributor_email": "grateful@example.com",
    "amount": 25.00,
    "volunteer_id": 1,
    "volunteer_name": "Alice Chen",
    "message": "Thank you for helping me!",
    "timestamp": "2025-11-18T20:30:00"
  }
]
```

#### Get Volunteer Contributions
```http
GET /api/seniorsmartassist/volunteer/{id}/contributions
```

Retrieves all contributions designated for a specific volunteer with total amount and count.

**Response (200 OK):**
```json
{
  "volunteer_id": 1,
  "volunteer_name": "Alice Chen",
  "total_contributions": 75.00,
  "contribution_count": 3,
  "contributions": [
    {
      "id": 1,
      "contributor_name": "John Donor",
      "amount": 25.00,
      "message": "Great work!",
      "timestamp": "2025-11-18T20:00:00"
    },
    {
      "id": 2,
      "contributor_name": "Mary Johnson",
      "amount": 50.00,
      "message": "Thank you so much!",
      "timestamp": "2025-11-18T19:30:00"
    }
  ]
}
```

**Error Responses:**
- `404 Not Found` - Volunteer not found

#### Register User
```http
POST /api/seniorsmartassist/register/{user_type}
Content-Type: application/json
```

Register a new user as either a volunteer or senior citizen. Replace `{user_type}` with `volunteer` or `elder`.

**Register as Volunteer:**
```http
POST /api/seniorsmartassist/register/volunteer

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "555-0103",
  "lat": 37.7849,
  "lng": -122.4194
}
```

**Register as Elder:**
```http
POST /api/seniorsmartassist/register/elder

{
  "name": "Robert Brown",
  "email": "robert@example.com",
  "phone": "555-0203",
  "address": "789 Pine St",
  "age": 70,
  "lat": 37.7549,
  "lng": -122.4494
}
```

**Age Requirement:** Senior citizens must be 60 years or older to register.

**Response (201 Created):**
```json
{
  "id": 3,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "age": 70,
  "type": "volunteer"
}
```

**Error Responses:**
- `400 Bad Request` - Age is required or senior citizen is under 60 years old
- `400 Bad Request` - Email already registered

#### Get All Volunteers
```http
GET /api/seniorsmartassist/volunteers
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Alice",
    "lat": 37.7749,
    "lng": -122.4194
  }
]
```

#### Get All Elders
```http
GET /api/seniorsmartassist/elders
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Mary Johnson",
    "email": "mary@example.com",
    "phone": "555-0201",
    "address": "123 Oak St",
    "age": 72
  }
]
```

#### Login
```http
POST /api/seniorsmartassist/login/{user_type}
Content-Type: application/json

{
  "username": "mary@example.com"
}
```

Login with email or phone number. `{user_type}` is either `elder` or `volunteer`.

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Mary Johnson",
  "email": "mary@example.com",
  "phone": "555-0201",
  "address": "123 Oak St",
  "age": 72,
  "type": "elder"
}
```

#### Accept Request (Volunteer)
```http
POST /api/seniorsmartassist/request/{id}/accept
Content-Type: application/json

{
  "volunteer_id": 1
}
```

Allows a volunteer to accept a pending request. Updates status to `assigned`.

**Response (200 OK):**
```json
{
  "id": 1,
  "status": "assigned",
  "volunteer_id": 1
}
```

#### Update Request Details
```http
PUT /api/seniorsmartassist/request/{id}
Content-Type: application/json

{
  "description": "Updated description",
  "address": "New address",
  "type": "groceries"
}
```

Updates request description, address, or type. Cannot update cancelled or completed requests.

**Response (200 OK):**
```json
{
  "id": 1,
  "description": "Updated description",
  "request_type": "groceries",
  "address": "New address",
  "status": "pending"
}
```

#### Classify Request Type
```http
POST /api/seniorsmartassist/classify-request
Content-Type: application/json

{
  "description": "Need help buying medicine"
}
```

AI-powered request type classification from description.

**Response (200 OK):**
```json
{
  "request_type": "Medical Assistance",
  "description": "Need help buying medicine"
}
```

#### Get Requests with Distance Filtering
```http
GET /api/seniorsmartassist/requests?volunteer_id=1
```

Get all requests. When `volunteer_id` is provided, calculates distances and filters out requests beyond 100 miles.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "request_type": "groceries",
    "description": "Need groceries",
    "status": "pending",
    "distance_miles": 5.2,
    "elder_name": "Mary Johnson"
  }
]
```

#### Get Volunteer Ratings and Rewards
```http
GET /api/seniorsmartassist/volunteer/{id}/ratings
```

Get all ratings and total rewards for a volunteer.

**Response (200 OK):**
```json
{
  "volunteer_id": 1,
  "volunteer_name": "Alice Chen",
  "overall_rating": 4.5,
  "total_ratings": 10,
  "total_rewards": 250.00,
  "ratings": [
    {
      "request_id": 1,
      "request_type": "groceries",
      "rating": 5,
      "rating_comment": "Excellent service!",
      "elder_name": "Mary Johnson",
      "completed_at": "2025-11-18T20:00:00"
    }
  ]
}
```

#### Get Donation Balance
```http
GET /api/seniorsmartassist/contributions/balance
```

Get total donation balance available for rewards.

**Response (200 OK):**
```json
{
  "total_donations": 1000.00,
  "total_rewards_given": 750.00,
  "available_balance": 250.00
}
```

#### Send Chat Message
```http
POST /api/seniorsmartassist/chat/{request_id}/send
Content-Type: application/json

{
  "sender_id": 1,
  "sender_type": "elder",
  "message": "Hello, when can you arrive?"
}
```

Send a chat message for a specific request. `sender_type` must be `elder` or `volunteer`.

**Response (201 Created):**
```json
{
  "id": 1,
  "request_id": 1,
  "sender_id": 1,
  "sender_type": "elder",
  "message": "Hello, when can you arrive?",
  "timestamp": "2025-11-18T20:00:00"
}
```

#### Get Chat Messages
```http
GET /api/seniorsmartassist/chat/{request_id}/messages
```

Get all chat messages for a specific request.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "request_id": 1,
    "sender_id": 1,
    "sender_type": "elder",
    "message": "Hello",
    "timestamp": "2025-11-18T20:00:00"
  }
]
```

#### Rate Volunteer
```http
POST /api/seniorsmartassist/request/{id}/rate
Content-Type: application/json

{
  "rating": 5,
  "rating_comment": "Excellent service!"
}
```

Rate a volunteer for a completed request. Rating must be 1-5.

**Response (200 OK):**
```json
{
  "id": 1,
  "rating": 5,
  "rating_comment": "Excellent service!"
}
```

#### Update Elder Profile
```http
PUT /api/seniorsmartassist/elder/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "555-9999",
  "address": "New Address"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Updated Name",
  "email": "mary@example.com",
  "phone": "555-9999",
  "address": "New Address",
  "age": 72
}
```

#### Update Volunteer Profile
```http
PUT /api/seniorsmartassist/volunteer/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "skills": "Groceries, Transportation",
  "availability": "available"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Updated Name",
  "email": "alice@example.com",
  "skills": "Groceries, Transportation",
  "availability": "available"
}
```

### WebSocket Events

#### Client → Server

**new_request**
```json
{
  "type": "groceries",
  "lat": 37.7749,
  "lng": -122.4194
}
```

#### Server → Client

**request_assigned**
```json
{
  "request_id": 1,
  "volunteer_id": 2,
  "volunteer_name": "Bob",
  "eta_min": 15.5,
  "volunteer_lat": 37.7849,
  "volunteer_lng": -122.4094
}
```

## Testing

### Run All Tests

```bash
pytest
```

### Run with Coverage

```bash
pytest --cov=src --cov-report=html
```

### Run Specific Test File

```bash
pytest tests/test_models.py
```

### Run Specific Test

```bash
pytest tests/test_routes.py::test_add_volunteer
```

## Architecture

### Request Lifecycle

Help requests follow a 5-state lifecycle from creation to completion:

```
┌─────────┐
│ pending │  ← Request created
└────┬────┘
     │
     ↓ (volunteer assigned)
┌──────────┐
│ assigned │  ← Volunteer accepts request
└────┬─────┘
     │
     ↓ (volunteer starts work)
┌─────────────┐
│ in_progress │  ← Volunteer is actively helping
└──────┬──────┘
     │
     ↓ (task finished)
┌───────────┐
│ completed │  ← Request fulfilled
└───────────┘

Note: Any state can transition to 'cancelled' if needed
```

**State Transitions:**
1. **pending → assigned**: When a volunteer is assigned via `/request/{id}/assign`
2. **assigned → in_progress**: When volunteer starts working (via `/request/{id}/status`)
3. **in_progress → completed**: When task is finished (via `/request/{id}/status`)
4. **any → cancelled**: Request can be cancelled at any stage

**Timestamps:**
- `timestamp`: When request was created
- `assigned_at`: When volunteer was assigned (set automatically on assignment)
- `completed_at`: When request was marked completed (set automatically when status changes to 'completed')

### Models

- **HelpRequest**: Stores assistance requests with:
  - `elder_id`: Foreign key to Elder who created the request
  - `volunteer_id`: Foreign key to assigned Volunteer (nullable)
  - `request_type`: Type of assistance needed (AI-classified)
  - `description`: Request description
  - `status`: Current state (pending, assigned, in_progress, completed, cancelled)
  - `address`: Request address
  - `latitude`, `longitude`: Location coordinates (optional)
  - `timestamp`: When request was created
  - `assigned_at`: When volunteer was assigned (nullable)
  - `completed_at`: When request was completed (nullable)
  - `rating`: Rating from 1-5 (nullable)
  - `rating_comment`: Optional rating comment (nullable)
  - `elder`: Relationship to Elder
  - `volunteer`: Relationship to Volunteer
  - `chat_messages`: Relationship to ChatMessage
  - `rewards`: Relationship to Reward

- **Volunteer**: Stores volunteer information with:
  - `name`, `email`, `phone`: Contact information
  - `address`: Volunteer address
  - `skills`: Comma-separated skills list
  - `gender`: Gender (optional)
  - `has_car`: Boolean flag
  - `availability`: available, busy, or unavailable
  - `created_at`: Registration timestamp
  - `assigned_requests`: Relationship to HelpRequest
  - `contributions`: Relationship to Contribution
  - `rewards`: Relationship to Reward

- **Elder**: Stores senior citizen information with:
  - `name`, `email`, `phone`, `address`: Contact and location information
  - `age`: Age of senior citizen (must be 60 or older)
  - `created_at`: Registration timestamp
  - `requests`: Relationship to HelpRequest

- **Contribution**: Tracks monetary contributions with:
  - `contributor_name`, `contributor_email`: Contributor information
  - `amount`: Contribution amount (must be > 0)
  - `volunteer_id`: Designated volunteer (nullable - null means general donation)
  - `message`: Optional message from contributor
  - `timestamp`: When contribution was made
  - `volunteer`: Relationship to Volunteer

- **ChatMessage**: Stores chat messages between elders and volunteers:
  - `request_id`: Foreign key to HelpRequest
  - `sender_id`: ID of sender (elder_id or volunteer_id)
  - `sender_type`: 'elder' or 'volunteer'
  - `message`: Message content
  - `timestamp`: When message was sent
  - `request`: Relationship to HelpRequest

- **Reward**: Tracks rewards assigned to volunteers:
  - `request_id`: Foreign key to HelpRequest
  - `volunteer_id`: Foreign key to Volunteer
  - `amount`: Reward amount in dollars
  - `timestamp`: When reward was assigned
  - `request`: Relationship to HelpRequest
  - `volunteer`: Relationship to Volunteer

### Event Flow

1. Client sends `new_request` via WebSocket
2. Server creates HelpRequest in database
3. Server queries all volunteers
4. Server calculates distances and finds nearest volunteer
5. Server emits `request_assigned` event with volunteer details and ETA

### Distance Calculation

Uses the `geopy` library with geodesic distance calculation for accurate results considering Earth's curvature.

### ETA Estimation

Default walking speed: 3 km/h (1.86 mph)
Formula: `ETA (minutes) = (distance_km / speed_kmh) * 60`

## Development

### Adding New Features

1. Create models in `src/main/models.py`
2. Add routes in `src/main/routes.py`
3. Add WebSocket handlers in `src/main/events.py`
4. Write tests in `tests/`

### Database Migrations

For production use, consider using Flask-Migrate:

```bash
pip install Flask-Migrate
```

## Troubleshooting

### Database Issues

- **SQLite locked**: Close all connections and restart
- **PostgreSQL connection failed**: Check credentials and ensure PostgreSQL is running

### Import Errors

Make sure you're running from the correct directory:
```bash
export PYTHONPATH=/path/to/backend:$PYTHONPATH
```

### Port Already in Use

Change the port in `app.py` or kill the process using port 5000:
```bash
lsof -ti:5000 | xargs kill -9
```

## Contributing

1. Write tests for new features
2. Ensure all tests pass
3. Follow PEP 8 style guidelines
4. Add docstrings to functions

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.
