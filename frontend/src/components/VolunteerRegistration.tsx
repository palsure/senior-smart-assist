import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { registerVolunteer } from '../services/api';

interface VolunteerRegistrationProps {
  onBack?: () => void;
}

const VolunteerRegistration: React.FC<VolunteerRegistrationProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gender: '',
    hasCar: false
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const validateForm = (): boolean => {
    // Check if all required fields are filled
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.phone.trim()) {
      setError('Please enter your phone number');
      return false;
    }

    // Basic phone validation (at least 10 digits)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(formData.phone.trim()) || formData.phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number (at least 10 digits)');
      return false;
    }

    if (!formData.address.trim()) {
      setError('Please enter your address');
      return false;
    }

    if (!formData.gender) {
      setError('Please select your gender');
      return false;
    }

    if (!formData.hasCar) {
      setError('You must have a car and driving skills to register as a volunteer');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      // Include gender and hasCar in registration data
      const registrationData = {
        ...formData,
        has_car: formData.hasCar
      };
      await registerVolunteer(registrationData);
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', address: '', gender: '', hasCar: false });
      setError(''); // Clear any previous errors
      
      // Show success message for 3 seconds before redirecting
      setTimeout(() => {
        if (onBack) onBack();
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      setSuccess(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Volunteer Registration</Text>
      
      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText}>
          Join SeniorSmartAssist as a volunteer and make a difference in your community. 
          Help senior citizens with urgent tasks, medical assistance, transportation, 
          and more. Our smart AI system will match you with requests that close to your location and availability.
          {'\n\n'}
          You have the option to earn rewards from donations, if you are interested.
        </Text>
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      
      {success ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>✓ Registration successful! Redirecting to sign in...</Text>
        </View>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Phone"
        value={formData.phone}
        onChangeText={(text) => setFormData({ ...formData, phone: text })}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Address"
        value={formData.address}
        onChangeText={(text) => setFormData({ ...formData, address: text })}
      />

      <View style={styles.inlineGroup}>
        <Text style={styles.inlineLabel}>Gender * </Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setFormData({ ...formData, gender: 'Male' })}
          >
            <View style={styles.radioCircle}>
              {formData.gender === 'Male' && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.radioLabel}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setFormData({ ...formData, gender: 'Female' })}
          >
            <View style={styles.radioCircle}>
              {formData.gender === 'Female' && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.radioLabel}>Female</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setFormData({ ...formData, gender: 'Other' })}
          >
            <View style={styles.radioCircle}>
              {formData.gender === 'Other' && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.radioLabel}>Other</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setFormData({ ...formData, hasCar: !formData.hasCar })}
        >
          <View style={[styles.checkboxBox, formData.hasCar && styles.checkboxChecked]}>
            {formData.hasCar && <Text style={styles.checkboxCheckmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>I have a car and driving skills</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Register as Volunteer</Text>
      </TouchableOpacity>

      {onBack && (
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already registered? </Text>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.signInLink}>Sign In here</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2196F3',
  },
  descriptionBox: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  descriptionText: {
    color: '#555',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  inlineGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  inlineLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  checkboxContainer: {
    marginBottom: 15,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
  },
  checkboxCheckmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 15,
    padding: 10,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#c62828',
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  successText: {
    color: '#2e7d32',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  signInText: {
    color: '#666',
    fontSize: 14,
  },
  signInLink: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default VolunteerRegistration;

