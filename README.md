# SeniorSmartAssist

A comprehensive platform connecting senior citizens with volunteers for assistance with daily tasks, medical needs, transportation, and more. Built with React Native (Expo) for cross-platform mobile and web support, and Flask backend with real-time WebSocket communication.

## 🎯 Project Overview

SeniorSmartAssist is a full-stack application designed to help senior citizens (60+) request assistance from volunteers in their community. The platform includes features for request management, real-time chat, volunteer matching, rewards system, and donation tracking.

## ✨ Key Features

### For Senior Citizens
- **User Registration & Authentication**: Secure sign-up and login with email/phone
- **Request Creation**: Submit help requests with AI-powered automatic classification
- **Request Types Supported**:
  - Medical Assistance
  - Groceries
  - Transportation
  - Home Maintenance
  - House Shifting
  - Technology Help
  - Companionship
  - Commute Assistance
  - Other
- **Request Management**: View all requests, track status, cancel requests
- **Real-time Chat**: Communicate with assigned volunteers via WebSocket
- **Volunteer Rating**: Rate and provide feedback after request completion
- **Profile Management**: Update personal information

### For Volunteers
- **User Registration & Authentication**: Sign up with skills and availability
- **Available Requests View**: Browse pending requests with distance filtering (up to 100 miles)
- **Distance Filtering**: Filter requests by distance (default 50 miles, max 100 miles)
- **Request Acceptance**: Accept requests with optional reward preference
- **My Requests View**: Track assigned, in-progress, and completed requests
- **Status Updates**: Update request status (assigned → in_progress → completed)
- **Rewards System**: Receive monetary rewards for completed requests based on complexity
- **Rating Display**: View overall rating and individual request ratings
- **Total Rewards Tracking**: See cumulative rewards earned from completed requests
- **Real-time Chat**: Communicate with elders via WebSocket
- **Profile Management**: Update skills, availability, and contact information

### For Donors
- **Contribution Form**: Make monetary contributions to support volunteers
- **General Donations**: Contribute to the general fund
- **Volunteer-Specific Donations**: Direct contributions to specific volunteers
- **Donation Tracking**: View total contributions received

### System Features
- **AI-Powered Request Classification**: Automatically categorizes requests based on description
- **Smart Volunteer Matching**: Matches requests with volunteers based on skills, distance, and availability
- **Real-time Updates**: WebSocket-based real-time notifications and chat
- **Distance Calculation**: Geocoding-based distance calculation for volunteer matching
- **Reward Calculation**: Automatic reward calculation based on request priority and type
- **Rating System**: 5-star rating system with optional comments
- **Cross-Platform Support**: Works on Web, iOS, and Android

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React Native)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │  iOS App     │  │ Android App  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                  │
│                    ┌──────▼──────┐                           │
│                    │  API Client │                           │
│                    │  (api.ts)   │                           │
│                    └──────┬──────┘                           │
│                           │                                  │
│                    ┌──────▼──────┐                           │
│                    │ WebSocket   │                           │
│                    │ (socket.ts) │                           │
│                    └──────┬──────┘                           │
└───────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Backend API   │
                    │  (Flask)       │
                    └────────┬───────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼──────┐    ┌────────▼────────┐  ┌───────▼──────┐
│   REST API  │    │  WebSocket IO   │  │  Database    │
│  (routes.py)│    │   (events.py)   │  │  (SQLite/    │
│             │    │                 │  │   PostgreSQL)│
└─────────────┘    └──────────────────┘  └──────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: React Hooks (useState, useEffect)
- **Navigation**: React Navigation
- **Styling**: StyleSheet API
- **Real-time Communication**: Socket.IO Client
- **HTTP Client**: Axios

#### Backend
- **Framework**: Flask (Python)
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: SQLAlchemy
- **Real-time Communication**: Flask-SocketIO
- **Geocoding**: Geopy (Nominatim)
- **Distance Calculation**: Geodesic (Haversine formula)
- **CORS**: Flask-CORS

### Database Schema

```
Elder
├── id (PK)
├── name
├── email (unique)
├── phone
├── address
├── age (>= 60)
└── created_at

Volunteer
├── id (PK)
├── name
├── email (unique)
├── phone
├── address
├── skills
├── gender
├── has_car
├── availability
└── created_at

HelpRequest
├── id (PK)
├── elder_id (FK → Elder)
├── volunteer_id (FK → Volunteer, nullable)
├── request_type
├── description
├── status (pending, assigned, in_progress, completed, cancelled)
├── address
├── latitude
├── longitude
├── timestamp
├── assigned_at
├── completed_at
├── rating (1-5)
└── rating_comment

Contribution
├── id (PK)
├── contributor_name
├── contributor_email
├── amount
├── volunteer_id (FK → Volunteer, nullable)
├── message
└── timestamp

ChatMessage
├── id (PK)
├── request_id (FK → HelpRequest)
├── sender_id
├── sender_type (elder/volunteer)
├── message
└── timestamp

Reward
├── id (PK)
├── request_id (FK → HelpRequest)
├── volunteer_id (FK → Volunteer)
├── amount
└── timestamp
```

### Request Lifecycle

```
┌─────────┐
│ pending │  ← Request created by elder
└────┬────┘
     │
     ↓ (volunteer accepts)
┌──────────┐
│ assigned │  ← Volunteer accepts request
└────┬─────┘
     │
     ↓ (volunteer starts work)
┌─────────────┐
│ in_progress │  ← Volunteer actively helping
└──────┬──────┘
     │
     ↓ (task finished)
┌───────────┐
│ completed │  ← Request fulfilled, reward assigned
└───────────┘

Note: Any state can transition to 'cancelled'
```

## 📁 Project Structure

```
seniorsmartassist/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── app.py          # Flask app factory
│   │   │   ├── models.py       # Database models
│   │   │   ├── routes.py       # REST API endpoints
│   │   │   ├── events.py       # WebSocket event handlers
│   │   │   └── utils.py        # Utilities (AI classification, matching, distance)
│   │   └── test/               # Unit tests
│   ├── run.py                  # Server entry point
│   ├── requirements.txt        # Python dependencies
│   └── README.md              # Backend documentation
│
├── frontend/
│   ├── src/
│   │   ├── components/         # React Native components
│   │   │   ├── SignIn.tsx
│   │   │   ├── RequestForm.tsx
│   │   │   ├── RequestList.tsx
│   │   │   ├── Chat.tsx
│   │   │   ├── ElderProfile.tsx
│   │   │   ├── VolunteerProfile.tsx
│   │   │   ├── ElderRegistration.tsx
│   │   │   ├── VolunteerRegistration.tsx
│   │   │   └── ContributionForm.tsx
│   │   ├── services/
│   │   │   ├── api.ts          # REST API client
│   │   │   └── socket.ts       # WebSocket client
│   │   ├── styles/             # StyleSheet definitions
│   │   └── types/              # TypeScript type definitions
│   ├── App.tsx                 # Main app component
│   ├── package.json
│   └── README.md              # Frontend documentation
│
└── README.md                   # This file
```

## 🚀 Getting Started

### Prerequisites

- **Backend**:
  - Python 3.10+
  - pip
  - Virtual environment (venv)

- **Frontend**:
  - Node.js 16+
  - npm or yarn
  - Expo CLI

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run database migrations** (if needed):
   ```bash
   python migrate_db.py
   ```

5. **Start the server**:
   ```bash
   python run.py
   ```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on specific platform**:
   ```bash
   npm run web      # Web browser
   npm run ios      # iOS simulator
   npm run android  # Android emulator
   ```

### Configuration

#### API Base URL

Update the base URL in `frontend/src/services/api.ts` and `frontend/src/services/socket.ts`:

- **Web**: `http://localhost:5000`
- **Android Emulator**: `http://10.0.2.2:5000`
- **iOS Simulator**: `http://localhost:5000`
- **Physical Device**: Use your computer's IP address (e.g., `http://192.168.1.100:5000`)

## 🔌 API Endpoints

### Authentication
- `POST /api/seniorsmartassist/register/<user_type>` - Register elder or volunteer
- `POST /api/seniorsmartassist/login/<user_type>` - Login with email/phone

### Requests
- `GET /api/seniorsmartassist/requests?volunteer_id=<id>` - Get all requests (with optional distance filtering)
- `POST /api/seniorsmartassist/request` - Create new request
- `POST /api/seniorsmartassist/classify-request` - Classify request type from description
- `GET /api/seniorsmartassist/elder/<id>/requests` - Get elder's requests
- `GET /api/seniorsmartassist/volunteer/<id>/requests` - Get volunteer's requests
- `POST /api/seniorsmartassist/request/<id>/accept` - Accept request (volunteer)
- `PUT /api/seniorsmartassist/request/<id>/status` - Update request status
- `PUT /api/seniorsmartassist/request/<id>` - Update request details
- `POST /api/seniorsmartassist/request/<id>/rate` - Rate volunteer (elder)

### Chat
- `GET /api/seniorsmartassist/chat/<request_id>/messages` - Get chat messages
- `POST /api/seniorsmartassist/chat/<request_id>/send` - Send chat message

### Contributions & Rewards
- `POST /api/seniorsmartassist/contribution` - Make contribution
- `GET /api/seniorsmartassist/contributions` - Get all contributions
- `GET /api/seniorsmartassist/contributions/balance` - Get donation balance
- `GET /api/seniorsmartassist/volunteer/<id>/contributions` - Get volunteer contributions
- `GET /api/seniorsmartassist/volunteer/<id>/ratings` - Get volunteer ratings and rewards

### Profiles
- `PUT /api/seniorsmartassist/elder/<id>` - Update elder profile
- `PUT /api/seniorsmartassist/volunteer/<id>` - Update volunteer profile

See `backend/README.md` for detailed API documentation.

## 🔄 Real-time Features

### WebSocket Events

**Client → Server**:
- `new_request` - Create new request
- `join_chat` - Join request chat room
- `leave_chat` - Leave request chat room

**Server → Client**:
- `request_created` - Broadcast new request to all volunteers
- `new_message` - Broadcast new chat message to request participants

## 🧠 AI Features

### Request Classification

The system automatically classifies requests into categories based on description using keyword matching and phrase detection:

- **Medical Assistance**: medicine, pharmacy, doctor, prescription, etc.
- **Groceries**: groceries, food, shopping, etc.
- **Transportation**: ride, drive, pick up, etc.
- **Home Maintenance**: repair, fix, maintenance, etc.
- **Technology Help**: computer, phone, internet, etc.
- **Companionship**: visit, chat, company, etc.
- **House Shifting**: move, shifting, relocation, etc.
- **Commute Assistance**: commute, travel, etc.

### Smart Volunteer Matching

Matches volunteers to requests based on:
- Skills match
- Distance (geocoding-based)
- Availability
- Request type compatibility

### Reward Calculation

Rewards are calculated based on:
- **Priority** (Urgent: $50, High: $30, Medium: $20, Normal: $10)
- **Request Type Multiplier** (Medical: 1.5x, House Shifting: 1.4x, etc.)

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
```

Test coverage includes:
- Model tests
- API endpoint tests
- Utility function tests

## 📱 Platform Support

- ✅ **Web** (React Native Web)
- ✅ **iOS** (Expo)
- ✅ **Android** (Expo)

## 🔒 Security Considerations

- Email validation and uniqueness
- Age validation for elders (60+)
- Request ownership validation
- Chat message sender verification
- CORS configuration for API access

## 🚧 Future Enhancements

- [ ] Push notifications for mobile
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Request priority queue
- [ ] Volunteer availability calendar
- [ ] Request history and analytics
- [ ] Multi-language support
- [ ] Voice input for request creation
- [ ] Image upload for requests
- [ ] Payment integration for contributions

## 📄 License

This project is part of a hackathon submission.

## 👥 Contributors

Built for the SeniorSmartAssist Hackathon.

## 📞 Support

For issues or questions, please refer to the individual README files in `backend/` and `frontend/` directories.

