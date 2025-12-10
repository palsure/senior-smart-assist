import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { loginElder, loginVolunteer } from '../services/api';
import { SignInProps, UserType, Elder, Volunteer } from '../types';
import { signInStyles } from '../styles/signInStyles';
import Logo from './Logo';

const SignIn: React.FC<SignInProps> = ({ onSignIn, onRegister }) => {
  const [username, setUsername] = useState('');
  const [userType, setUserType] = useState<UserType>('elder');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    if (userType === 'donor') {
      onRegister('donor');
      setLoading(false);
      return;
    }

    if (!username.trim()) {
      setError('Email or phone number is required');
      setLoading(false);
      return;
    }

    try {
      if (userType === 'elder') {
        try {
          const response = await loginElder(username);
          onSignIn(response.data, 'elder');
        } catch (err: any) {
          setError(err?.response?.data?.error || 'Account not found. Please create account.');
        }
      } else {
        try {
          const response = await loginVolunteer(username);
          onSignIn(response.data, 'volunteer');
        } catch (err: any) {
          setError(err?.response?.data?.error || 'Account not found. Please create account.');
        }
      }
    } catch (err: any) {
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={signInStyles.container} 
      contentContainerStyle={signInStyles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={signInStyles.card}>
        <View style={signInStyles.logoContainer}>
          <Logo size={70} />
          <Text style={signInStyles.title}>SeniorSmartAssist</Text>
        </View>

        <View style={signInStyles.infoBox}>
          <Text style={signInStyles.infoTitle}>Connecting senior citizens with caring volunteers.</Text>
          <Text style={signInStyles.infoText}>
            🧓 Get help with daily tasks as a senior citizen{'\n'}
            🤝 Volunteer to make a difference in your community{'\n'}
            💖 Donate to support our senior citizens who needs help{'\n'}
            🤖 Smart AI capabilities: Intelligent volunteer matching, NLP-based voice-to-text & request type categorization
          </Text>
        </View>

        <Text style={signInStyles.chooseText}>Choose the best option suits you:</Text>

        <View style={signInStyles.toggleContainer}>
          <TouchableOpacity
            style={[signInStyles.toggleButton, userType === 'elder' && signInStyles.toggleButtonActiveElder]}
            onPress={() => { setUserType('elder'); setError(''); }}
          >
              <Text style={[signInStyles.toggleText, userType === 'elder' && signInStyles.toggleTextActive]}>
                🧓 Senior Citizen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[signInStyles.toggleButton, userType === 'volunteer' && signInStyles.toggleButtonActiveVolunteer]}
            onPress={() => { setUserType('volunteer'); setError(''); }}
          >
              <Text style={[signInStyles.toggleText, userType === 'volunteer' && signInStyles.toggleTextActive]}>
                🤝 Volunteer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[signInStyles.toggleButton, userType === 'donor' && signInStyles.toggleButtonActiveDonor]}
            onPress={() => { setUserType('donor'); setError(''); }}
          >
            <Text style={[signInStyles.toggleText, userType === 'donor' && signInStyles.toggleTextActive]}>
              💖 Donate
            </Text>
          </TouchableOpacity>
        </View>

      {userType !== 'donor' && (
        <View style={signInStyles.inputContainer}>
          <Text style={signInStyles.label}>Sign In as {userType === 'elder' ? 'Senior Citizen' : 'Volunteer'}:</Text>
          <TextInput
            style={signInStyles.input}
            placeholder="Enter your email or phone number"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#999"
          />
        </View>
      )}

        {userType === 'donor' && (
          <View style={signInStyles.donorMessage}>
            <Text style={signInStyles.donorMessageTitle}>💖 Make a contribution to support our senior citizens who needs help</Text>
            <Text style={signInStyles.donorMessageText}>No account needed. Click continue to donate.</Text>
          </View>
        )}

        {error ? (
          <View style={signInStyles.errorContainer}>
            <Text style={signInStyles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            signInStyles.button,
            loading && signInStyles.buttonDisabled,
            userType === 'elder' && signInStyles.buttonElder,
            userType === 'volunteer' && signInStyles.buttonVolunteer,
            userType === 'donor' && signInStyles.buttonDonor
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={signInStyles.buttonText}>
            {loading ? 'Please wait...' : userType === 'donor' ? 'Continue to Donate' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        {userType !== 'donor' && (
          <View style={signInStyles.registerContainer}>
            <Text style={signInStyles.registerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => onRegister(userType)} style={signInStyles.registerButton}>
              <Text style={signInStyles.registerButtonText}>
                Create {userType === 'elder' ? 'Senior Citizen' : 'Volunteer'} Account
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default SignIn;

