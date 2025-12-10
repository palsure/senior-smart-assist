# SeniorSmartAssist Frontend

React Native application built with Expo for cross-platform support (Web, iOS, Android). Provides a complete interface for elders, volunteers, and donors to interact with the SeniorSmartAssist platform.

## Features

### For Senior Citizens (Elders)
- ✅ **Sign In/Registration**: Secure authentication with email or phone
- ✅ **Request Creation**: Submit help requests with AI-powered automatic classification
- ✅ **My Requests View**: Track all requests with status updates
- ✅ **Real-time Chat**: Communicate with assigned volunteers via WebSocket
- ✅ **Volunteer Rating**: Rate and provide feedback after request completion
- ✅ **Profile Management**: Update personal information

### For Volunteers
- ✅ **Sign In/Registration**: Register with skills and availability
- ✅ **Available Requests**: Browse pending requests with distance filtering (up to 100 miles)
- ✅ **Distance Filter**: Adjustable distance filter (default 50 miles, max 100 miles)
- ✅ **Request Acceptance**: Accept requests with optional reward preference
- ✅ **My Requests**: Track assigned, in-progress, and completed requests
- ✅ **Status Updates**: Update request status (assigned → in_progress → completed)
- ✅ **Rewards Display**: View rewards earned for completed requests
- ✅ **Rating Display**: View overall rating and individual request ratings
- ✅ **Total Rewards**: See cumulative rewards earned
- ✅ **Real-time Chat**: Communicate with elders via WebSocket
- ✅ **Profile Management**: Update skills, availability, and contact information

### For Donors
- ✅ **Contribution Form**: Make monetary contributions
- ✅ **General Donations**: Contribute to the general fund
- ✅ **Volunteer-Specific Donations**: Direct contributions to specific volunteers

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: React Hooks (useState, useEffect)
- **Navigation**: React Navigation
- **Styling**: StyleSheet API
- **Real-time Communication**: Socket.IO Client
- **HTTP Client**: Axios

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React Native components
│   │   ├── SignIn.tsx
│   │   ├── RequestForm.tsx
│   │   ├── RequestList.tsx
│   │   ├── Chat.tsx
│   │   ├── ElderProfile.tsx
│   │   ├── VolunteerProfile.tsx
│   │   ├── ElderRegistration.tsx
│   │   ├── VolunteerRegistration.tsx
│   │   ├── ContributionForm.tsx
│   │   ├── AssignedInfo.tsx
│   │   └── Logo.tsx
│   ├── services/
│   │   ├── api.ts           # REST API client
│   │   └── socket.ts        # WebSocket client
│   ├── styles/              # StyleSheet definitions
│   │   ├── appStyles.ts
│   │   ├── signInStyles.ts
│   │   └── requestFormStyles.ts
│   └── types/               # TypeScript type definitions
│       └── index.ts
├── App.tsx                  # Main app component
├── index.ts                 # Entry point
├── package.json
└── tsconfig.json
```

## Installation

### Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI (installed globally or via npx)

### Setup

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
   npm run ios      # iOS simulator (requires Xcode on Mac)
   npm run android  # Android emulator (requires Android Studio)
   ```

## Configuration

### API Base URL

Update the base URL in `src/services/api.ts` and `src/services/socket.ts` based on your platform:

- **Web**: `http://localhost:5000`
- **Android Emulator**: `http://10.0.2.2:5000`
- **iOS Simulator**: `http://localhost:5000`
- **Physical Device**: Use your computer's IP address (e.g., `http://192.168.1.100:5000`)

To find your IP address:
- **Mac/Linux**: `ifconfig | grep "inet "`
- **Windows**: `ipconfig`

The API client automatically detects the platform and uses the appropriate base URL.

## Key Components

### App.tsx
Main application component that handles:
- User authentication state
- Navigation between sign-in, registration, and main app
- Tab navigation for elders and volunteers
- Global state management

### RequestList.tsx
Comprehensive request management component:
- Displays requests in a table format
- Distance filtering for volunteers
- Status update modals
- Reward display and rating tooltips
- Real-time chat integration
- Request acceptance and release

### Chat.tsx
Real-time chat component:
- WebSocket-based messaging
- Optimistic UI updates
- Message notifications
- Auto-scroll to latest message

### RequestForm.tsx
Request creation form:
- Description input
- Address input
- AI-powered automatic classification
- Request submission

## Platform-Specific Considerations

### Web Platform
- Full feature support
- Mouse hover events for tooltips
- Web Speech API (if implemented)

### Mobile Platforms
- Touch-optimized UI
- Platform-specific navigation
- Safe area handling
- Keyboard avoidance

## Real-time Features

### WebSocket Integration

The app uses Socket.IO for real-time communication:

- **Connection**: Automatically connects on app start
- **Chat Messages**: Real-time message delivery
- **Request Notifications**: New request broadcasts
- **Reconnection**: Automatic reconnection on disconnect

### Optimistic UI Updates

Chat messages are optimistically added to the UI before server confirmation for instant feedback.

## Styling

The app uses React Native's StyleSheet API for consistent styling across platforms:

- **Centralized Styles**: Styles defined in `src/styles/`
- **Component-Specific Styles**: Inline styles for component-specific needs
- **Responsive Design**: Flexbox-based layouts

## Error Handling

- Network error handling with user-friendly messages
- Form validation with error display
- Loading states for async operations
- Error boundaries for crash prevention

## Development Notes

- The app uses Expo for cross-platform development
- Platform detection via `Platform.OS`
- Lazy initialization of API and Socket clients to prevent module load-time errors
- Safe Platform checks to prevent Android initialization issues

## Testing

### Manual Testing

Test on all platforms:
1. Web browser
2. iOS simulator/device
3. Android emulator/device

### Key Test Scenarios

- User registration and login
- Request creation and management
- Volunteer request acceptance
- Status updates
- Real-time chat
- Rating submission
- Profile updates
- Distance filtering

## Troubleshooting

### Android Black Screen
- Ensure backend is running
- Check API base URL configuration
- Verify network connectivity
- Check React Native logs: `adb logcat -s ReactNativeJS:*`

### WebSocket Connection Issues
- Verify backend WebSocket server is running
- Check CORS configuration
- Ensure correct base URL for socket connection

### Platform-Specific Issues
- Use `Platform.OS` checks for platform-specific code
- Test on actual devices, not just simulators
- Check device logs for errors

## Production Build

### Web
```bash
npm run build
```

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## License

This project is part of a hackathon submission.

## Support

For issues or questions, refer to the main project README or backend documentation.
