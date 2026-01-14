import React, { useState, useEffect } from 'react';
import { View, Alert, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { socket, AssignedData } from './src/services/socket';
import SignIn from './src/components/SignIn';
import { Elder, Volunteer } from './src/types';
import { appStyles } from './src/styles/appStyles';
import { CurrentUser, ElderTabType, VolunteerTabType, RegistrationType } from './src/types';
import RequestForm from './src/components/RequestForm';
import RequestList from './src/components/RequestList';
import ElderProfile from './src/components/ElderProfile';
import VolunteerProfile from './src/components/VolunteerProfile';
import ElderRegistration from './src/components/ElderRegistration';
import VolunteerRegistration from './src/components/VolunteerRegistration';
import ContributionForm from './src/components/ContributionForm';
import About from './src/components/About';
import Logo from './src/components/Logo';
import { getVolunteerRatings, VolunteerRatingsResponse } from './src/services/api';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  console.log('App component rendering...');
  const [assigned, setAssigned] = useState<AssignedData | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [registrationType, setRegistrationType] = useState<RegistrationType>('elder');
  const [isDonor, setIsDonor] = useState(false);
  const [showAbout, setShowAbout] = useState(true); // Show About page by default
  const [totalContributions, setTotalContributions] = useState<number>(0);
  
  // Track if we should preserve Profile tab after update
  const preserveProfileTabRef = React.useRef(false);
  
  React.useEffect(() => {
    console.log('App mounted, currentUser:', currentUser, 'showRegister:', showRegister, 'isDonor:', isDonor);
  }, [currentUser, showRegister, isDonor]);

  useEffect(() => {
    try {
      socket.on("request_assigned", (data: AssignedData) => {
        setAssigned(data);
        const matchInfo = data.match_score ? ` (Match: ${(data.match_score * 100).toFixed(0)}%)` : '';
        Alert.alert('Request Assigned', `Volunteer ${data.volunteer_name} assigned!${matchInfo}`);
      });
    } catch (error) {
      console.warn('Socket setup error:', error);
    }

    return () => {
      try {
        socket.off("request_assigned");
      } catch (error) {
        console.warn('Socket cleanup error:', error);
      }
    };
  }, []);

  const handleSignIn = (user: Elder | Volunteer, userType: 'elder' | 'volunteer') => {
    setCurrentUser({ user, type: userType });
    setShowRegister(false);
    setIsDonor(false);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setShowRegister(false);
    setIsDonor(false);
    setShowAbout(true); // Return to About page after sign out
  };

  const handleShowRegister = (userType: 'elder' | 'volunteer' | 'donor') => {
    if (userType === 'donor') {
      setIsDonor(true);
      setShowRegister(false);
    } else {
      setRegistrationType(userType);
      setShowRegister(true);
      setIsDonor(false);
    }
  };

  const handleProfileUpdate = (updatedElder: Elder) => {
    if (currentUser && currentUser.type === 'elder') {
      preserveProfileTabRef.current = true;
      setCurrentUser({ user: updatedElder, type: 'elder' });
    }
  };

  const handleVolunteerProfileUpdate = (updatedVolunteer: Volunteer) => {
    if (currentUser && currentUser.type === 'volunteer') {
      preserveProfileTabRef.current = true;
      setCurrentUser({ user: updatedVolunteer, type: 'volunteer' });
    }
  };

  // Show About page by default (when not logged in and not showing register/donor)
  if (showAbout && !currentUser && !showRegister && !isDonor) {
    return (
      <SafeAreaProvider>
        <View style={appStyles.container}>
          <About onBack={() => setShowAbout(false)} />
        </View>
      </SafeAreaProvider>
    );
  }

  // Show sign-in if not logged in
  if (!currentUser && !showRegister && !isDonor) {
    console.log('Rendering SignIn screen');
    try {
      return (
        <SafeAreaProvider>
          <View style={appStyles.container}>
            <SignIn 
              onSignIn={handleSignIn} 
              onRegister={handleShowRegister}
              onShowAbout={() => setShowAbout(true)}
            />
          </View>
        </SafeAreaProvider>
      );
    } catch (error) {
      console.error('Error rendering SignIn:', error);
      return (
        <SafeAreaProvider>
          <View style={[appStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: 'red', padding: 20, fontSize: 16 }}>
              Error loading app: {error instanceof Error ? error.message : String(error)}
            </Text>
          </View>
        </SafeAreaProvider>
      );
    }
  }

  // Show donation screen for donors
  if (isDonor) {
    return (
      <SafeAreaProvider>
        <View style={appStyles.container}>
          <View style={appStyles.header}>
            <TouchableOpacity 
              style={appStyles.headerLeft}
              onPress={() => setIsDonor(false)}
            >
              <Logo size={50} />
              <View>
                <Text style={appStyles.headerTitle}>SeniorSmartAssist</Text>
              </View>
            </TouchableOpacity>
            <View style={appStyles.headerCenter}>
              <View style={appStyles.totalContributions}>
                <Text style={appStyles.totalContributionsText}>
                  Total Contributions Received: ${totalContributions.toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={appStyles.headerRight}>
              <TouchableOpacity
                style={appStyles.backButton}
                onPress={() => setIsDonor(false)}
              >
                <Text style={appStyles.backButtonText}>← Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ContributionForm onTotalChange={setTotalContributions} />
        </View>
      </SafeAreaProvider>
    );
  }

  // Show registration screen
  if (!currentUser && showRegister) {
    return (
      <SafeAreaProvider>
        <View style={appStyles.container}>
          <View style={appStyles.header}>
            <TouchableOpacity
              style={appStyles.headerLeft}
              onPress={() => setShowRegister(false)}
            >
              <Logo size={40} />
              <Text style={appStyles.headerTitle}>SeniorSmartAssist</Text>
            </TouchableOpacity>
          </View>
          {registrationType === 'elder' ? (
            <ElderRegistration onBack={() => setShowRegister(false)} />
          ) : (
            <VolunteerRegistration onBack={() => setShowRegister(false)} />
          )}
        </View>
      </SafeAreaProvider>
    );
  }

  // Main app with navigation
  const ElderTabs = () => {
    const [activeTab, setActiveTab] = useState<ElderTabType>('SubmitRequest');
    
    // Preserve Profile tab when updating profile
    const handleProfileUpdateWithTabPreservation = (updatedElder: Elder) => {
      handleProfileUpdate(updatedElder);
    };
    
    // Restore Profile tab if we just updated the profile
    React.useEffect(() => {
      if (preserveProfileTabRef.current) {
        setActiveTab('Profile');
        preserveProfileTabRef.current = false;
      }
    }, [currentUser]);
    
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Dark Grey Top Bar */}
        <View style={{ height: 20, backgroundColor: '#424242' }} />
        
        {/* Main Header */}
        <View style={appStyles.mainHeader}>
          <TouchableOpacity 
            style={appStyles.headerLeft}
            onPress={handleSignOut}
          >
            <Logo size={40} />
            <Text style={appStyles.headerTitle}>SeniorSmartAssist</Text>
          </TouchableOpacity>
          <View style={appStyles.headerRight}>
            <Text style={appStyles.welcomeText}>Welcome, {currentUser!.user.name}</Text>
            <TouchableOpacity
              style={appStyles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={appStyles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Green Separator Line */}
        <View style={appStyles.separatorLine} />
        
        {/* Main Content Area with Left Sidebar */}
        <View style={appStyles.mainContentContainer}>
          {/* Left Side Tab Navigation */}
          <View style={appStyles.leftTabs}>
            <TouchableOpacity
              style={[appStyles.leftTabButton, activeTab === 'SubmitRequest' && appStyles.leftTabButtonActive]}
              onPress={() => setActiveTab('SubmitRequest')}
            >
              {activeTab === 'SubmitRequest' && <View style={appStyles.leftTabIndicator} />}
              <Text style={[appStyles.tabIcon, activeTab === 'SubmitRequest' && appStyles.tabIconActive]}>➕</Text>
              <Text style={[appStyles.tabLabel, activeTab === 'SubmitRequest' && appStyles.tabLabelActive]}>
                Submit Request
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[appStyles.leftTabButton, activeTab === 'MyRequests' && appStyles.leftTabButtonActive]}
              onPress={() => setActiveTab('MyRequests')}
            >
              {activeTab === 'MyRequests' && <View style={appStyles.leftTabIndicator} />}
              <Text style={[appStyles.tabIcon, activeTab === 'MyRequests' && appStyles.tabIconActive]}>☰</Text>
              <Text style={[appStyles.tabLabel, activeTab === 'MyRequests' && appStyles.tabLabelActive]}>
                My Requests
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[appStyles.leftTabButton, activeTab === 'Profile' && appStyles.leftTabButtonActive]}
              onPress={() => setActiveTab('Profile')}
            >
              {activeTab === 'Profile' && <View style={appStyles.leftTabIndicator} />}
              <Text style={[appStyles.tabIcon, activeTab === 'Profile' && appStyles.tabIconActive]}>👤</Text>
              <Text style={[appStyles.tabLabel, activeTab === 'Profile' && appStyles.tabLabelActive]}>
                My Profile
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Tab Content */}
          <View style={appStyles.tabContentArea}>
          {activeTab === 'SubmitRequest' && (
            <RequestForm
              address={currentUser!.user.address}
              elder={currentUser!.user as Elder}
              assigned={assigned}
            />
          )}
          {activeTab === 'MyRequests' && (
            <RequestList 
              currentUserId={currentUser?.user.id}
              currentUserType="elder"
            />
          )}
          {activeTab === 'Profile' && (
            <ElderProfile
              elder={currentUser!.user as Elder}
              onUpdate={handleProfileUpdateWithTabPreservation}
            />
          )}
          </View>
        </View>
      </View>
    );
  };

  const VolunteerTabs = () => {
    const [activeTab, setActiveTab] = useState<VolunteerTabType>('AvailableRequests');
    const [volunteerRatings, setVolunteerRatings] = useState<VolunteerRatingsResponse | null>(null);
    const [ratingsLoading, setRatingsLoading] = useState<boolean>(true);
    
    // Preserve Profile tab when updating profile
    const handleVolunteerProfileUpdateWithTabPreservation = (updatedVolunteer: Volunteer) => {
      handleVolunteerProfileUpdate(updatedVolunteer);
    };
    
    // Restore Profile tab if we just updated the profile
    React.useEffect(() => {
      if (preserveProfileTabRef.current) {
        setActiveTab('Profile');
        preserveProfileTabRef.current = false;
      }
    }, [currentUser]);

    // Load volunteer ratings function (exposed for manual refresh)
    const loadRatings = React.useCallback(async () => {
      if (currentUser?.user.id && currentUser.type === 'volunteer') {
        try {
          setRatingsLoading(true);
          const response = await getVolunteerRatings(currentUser.user.id);
          setVolunteerRatings(response.data);
        } catch (err) {
          console.error('Failed to load volunteer ratings:', err);
        } finally {
          setRatingsLoading(false);
        }
      }
    }, [currentUser]);

    // Load volunteer ratings on mount and set up auto-refresh
    React.useEffect(() => {
      loadRatings();
      // Refresh ratings every 10 seconds
      const interval = setInterval(loadRatings, 10000);
      return () => clearInterval(interval);
    }, [loadRatings]);
    
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Dark Grey Top Bar */}
        <View style={{ height: 20, backgroundColor: '#424242' }} />
        
        {/* Main Header */}
        <View style={appStyles.mainHeader}>
          <TouchableOpacity 
            style={appStyles.headerLeft}
            onPress={handleSignOut}
          >
            <Logo size={40} />
            <Text style={appStyles.headerTitle}>SeniorSmartAssist</Text>
          </TouchableOpacity>
          <View style={appStyles.headerRight}>
            <Text style={appStyles.welcomeText}>Welcome, {currentUser!.user.name}</Text>
            <TouchableOpacity
              style={appStyles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={appStyles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Green Separator Line */}
        <View style={appStyles.separatorLine} />
        
        {/* Overall Rating, Total Requests, and Total Rewards Display */}
        {volunteerRatings && (
          <View style={appStyles.overallRatingContainer}>
            {volunteerRatings.overall_rating !== null && (
              <>
                <Text style={appStyles.overallRatingLabel}>Overall Rating:</Text>
                <Text style={appStyles.overallRatingStars}>
                  {'⭐'.repeat(Math.round(volunteerRatings.overall_rating))}
                </Text>
                <Text style={appStyles.overallRatingValue}>
                  {volunteerRatings.overall_rating.toFixed(1)} ({volunteerRatings.total_ratings})
                </Text>
                <Text style={appStyles.overallRatingSeparator}> | </Text>
              </>
            )}
            <Text style={appStyles.totalRequestsLabel}>Total Requests:</Text>
            <Text style={appStyles.totalRequestsValue}>
              {volunteerRatings.total_requests || 0}
            </Text>
            <Text style={appStyles.overallRatingSeparator}> | </Text>
            <Text style={appStyles.totalRewardsLabel}>Total Rewards:</Text>
            <Text style={appStyles.totalRewardsValue}>
              ${(volunteerRatings.total_rewards || 0).toFixed(2)}
            </Text>
          </View>
        )}
        
        {/* Main Content Area with Left Sidebar */}
        <View style={appStyles.mainContentContainer}>
          {/* Left Side Tab Navigation */}
          <View style={appStyles.leftTabs}>
            <TouchableOpacity
              style={[appStyles.leftTabButton, activeTab === 'AvailableRequests' && appStyles.leftTabButtonActive]}
              onPress={() => setActiveTab('AvailableRequests')}
            >
              {activeTab === 'AvailableRequests' && <View style={appStyles.leftTabIndicator} />}
              <Text style={[appStyles.tabIcon, activeTab === 'AvailableRequests' && appStyles.tabIconActive]}>☰</Text>
              <Text style={[appStyles.tabLabel, activeTab === 'AvailableRequests' && appStyles.tabLabelActive]}>
                Available Requests
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[appStyles.leftTabButton, activeTab === 'MyRequests' && appStyles.leftTabButtonActive]}
              onPress={() => setActiveTab('MyRequests')}
            >
              {activeTab === 'MyRequests' && <View style={appStyles.leftTabIndicator} />}
              <Text style={[appStyles.tabIcon, activeTab === 'MyRequests' && appStyles.tabIconActive]}>📋</Text>
              <Text style={[appStyles.tabLabel, activeTab === 'MyRequests' && appStyles.tabLabelActive]}>
                My Requests
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[appStyles.leftTabButton, activeTab === 'Profile' && appStyles.leftTabButtonActive]}
              onPress={() => setActiveTab('Profile')}
            >
              {activeTab === 'Profile' && <View style={appStyles.leftTabIndicator} />}
              <Text style={[appStyles.tabIcon, activeTab === 'Profile' && appStyles.tabIconActive]}>👤</Text>
              <Text style={[appStyles.tabLabel, activeTab === 'Profile' && appStyles.tabLabelActive]}>
                My Profile
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Tab Content */}
          <View style={appStyles.tabContentArea}>
          {activeTab === 'AvailableRequests' && (
            <RequestList 
              isVolunteerView={true} 
              currentVolunteerId={currentUser?.user.id}
              currentUserId={currentUser?.user.id}
              currentUserType="volunteer"
              showMyRequests={false}
              onRequestCompleted={loadRatings}
            />
          )}
          {activeTab === 'MyRequests' && (
            <RequestList 
              isVolunteerView={true} 
              currentVolunteerId={currentUser?.user.id}
              currentUserId={currentUser?.user.id}
              currentUserType="volunteer"
              showMyRequests={true}
              onRequestCompleted={loadRatings}
            />
          )}
          {activeTab === 'Profile' && (
            <VolunteerProfile
              volunteer={currentUser!.user as Volunteer}
              onUpdate={handleVolunteerProfileUpdateWithTabPreservation}
            />
          )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {currentUser?.type === 'elder' ? (
            <Stack.Screen name="Main" component={ElderTabs} />
          ) : (
            <Stack.Screen name="Main" component={VolunteerTabs} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

