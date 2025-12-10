import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { Elder, API } from "../services/api";

interface ElderProfileProps {
  elder: Elder;
  onUpdate: (updatedElder: Elder) => void;
}

const ElderProfile: React.FC<ElderProfileProps> = ({ elder, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: elder.name,
    email: elder.email,
    phone: elder.phone,
    address: elder.address,
    age: elder.age.toString(),
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const justUpdatedRef = useRef(false);

  useEffect(() => {
    // Update form data when elder changes, but preserve success state if we just updated
    if (!justUpdatedRef.current) {
      setFormData({
        name: elder.name,
        email: elder.email,
        phone: elder.phone,
        address: elder.address,
        age: elder.age.toString(),
      });
    }
  }, [elder]);
  
  // Ensure success message shows even after prop update
  useEffect(() => {
    if (justUpdatedRef.current && !success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        justUpdatedRef.current = false;
      }, 5000);
    }
  }, [elder]);

  const handleSubmit = async () => {
    setError("");
    setSuccess(false);

    const age = parseInt(formData.age);
    if (age < 60) {
      setError("Age must be 60 or older");
      return;
    }

    try {
      const response = await API.put(`/elder/${elder.id}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        age: age,
      });
      justUpdatedRef.current = true;
      setSuccess(true);
      setIsEditing(false);
      // Update parent
      onUpdate(response.data);
      // Keep success message visible for 5 seconds after update
      setTimeout(() => {
        setSuccess(false);
        justUpdatedRef.current = false;
      }, 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Update failed");
    }
  };

  const handleCancel = () => {
    setFormData({
      name: elder.name,
      email: elder.email,
      phone: elder.phone,
      address: elder.address,
      age: elder.age.toString(),
    });
    setIsEditing(false);
    setError("");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>👤 My Profile</Text>
        {!isEditing && (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>✓ Profile updated successfully!</Text>
        </View>
      ) : null}

      {!isEditing ? (
        <View style={styles.profileInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{elder.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{elder.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{elder.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{elder.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Age:</Text>
            <Text style={styles.value}>{elder.age} years</Text>
          </View>
        </View>
      ) : (
        <View>
          <TextInput
            style={styles.input}
            placeholder="Name"
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
            placeholder="Age"
            value={formData.age}
            onChangeText={(text) => setFormData({ ...formData, age: text })}
            keyboardType="numeric"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  profileInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontWeight: 'bold',
    color: '#555',
    width: 100,
  },
  value: {
    flex: 1,
    color: '#333',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    alignItems: 'flex-start',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#666',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
});

export default ElderProfile;

