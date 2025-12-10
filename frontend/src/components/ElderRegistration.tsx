import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { registerElder } from "../services/api";

interface ElderRegistrationProps {
  onBack?: () => void;
}

const ElderRegistration: React.FC<ElderRegistrationProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    age: "",
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  const validateForm = (): boolean => {
    // Check if all fields are filled
    if (!formData.name.trim()) {
      setError("Please enter your full name");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!formData.phone.trim()) {
      setError("Please enter your phone number");
      return false;
    }

    // Basic phone validation (at least 10 digits)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(formData.phone.trim()) || formData.phone.replace(/\D/g, '').length < 10) {
      setError("Please enter a valid phone number (at least 10 digits)");
      return false;
    }

    if (!formData.address.trim()) {
      setError("Please enter your address");
      return false;
    }

    if (!formData.age.trim()) {
      setError("Please enter your age");
      return false;
    }

    const age = parseInt(formData.age);
    if (isNaN(age)) {
      setError("Please enter a valid age");
      return false;
    }

    if (age < 60) {
      setError("Senior citizen must be 60 years or older");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess(false);

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    const age = parseInt(formData.age);

    try {
      await registerElder({
        ...formData,
        age,
      });
      setSuccess(true);
      setFormData({ name: "", email: "", phone: "", address: "", age: "" });
      setError(""); // Clear any previous errors
      
      // Show success message for 3 seconds before redirecting
      setTimeout(() => {
        if (onBack) onBack();
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
      setSuccess(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Senior Citizen Registration</Text>
      
      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText}>
          Join SeniorSmartAssist to connect with caring volunteers in your community. 
          Register to request help with daily tasks, medical assistance, transportation, 
          and more. Our smart AI system will match you with the best volunteer for your needs.
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

      <TextInput
        style={styles.input}
        placeholder="Age (must be 60+)"
        value={formData.age}
        onChangeText={(text) => setFormData({ ...formData, age: text })}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Register as Senior Citizen</Text>
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
    color: '#4CAF50',
  },
  descriptionBox: {
    backgroundColor: '#e8f5e9',
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
  button: {
    backgroundColor: '#4CAF50',
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
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default ElderRegistration;

