import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { Volunteer, API } from "../services/api";

interface VolunteerProfileProps {
  volunteer: Volunteer;
  onUpdate: (updatedVolunteer: Volunteer) => void;
}

const VolunteerProfile: React.FC<VolunteerProfileProps> = ({ volunteer, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: volunteer.name,
    email: volunteer.email,
    phone: volunteer.phone,
    address: volunteer.address || '',
    skills: volunteer.skills || '',
    availability: volunteer.availability || 'available' as 'available' | 'busy' | 'unavailable',
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const justUpdatedRef = useRef(false);

  useEffect(() => {
    // Update form data when volunteer changes, but preserve success state if we just updated
    if (!justUpdatedRef.current) {
      setFormData({
        name: volunteer.name,
        email: volunteer.email,
        phone: volunteer.phone,
        address: volunteer.address || '',
        skills: volunteer.skills || '',
        availability: volunteer.availability || 'available' as 'available' | 'busy' | 'unavailable',
      });
    }
  }, [volunteer]);
  
  // Ensure success message shows even after prop update
  useEffect(() => {
    if (justUpdatedRef.current && !success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        justUpdatedRef.current = false;
      }, 5000);
    }
  }, [volunteer]);

  const handleSubmit = async () => {
    setError("");
    setSuccess(false);

    try {
      const response = await API.put(`/volunteer/${volunteer.id}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        skills: formData.skills,
        availability: formData.availability,
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
      name: volunteer.name,
      email: volunteer.email,
      phone: volunteer.phone,
      address: volunteer.address || '',
      skills: volunteer.skills || '',
      availability: volunteer.availability || 'available' as 'available' | 'busy' | 'unavailable',
    });
    setIsEditing(false);
    setError("");
  };

  const getAvailabilityColor = (availability?: string) => {
    switch (availability) {
      case 'available': return '#4CAF50';
      case 'busy': return '#FF9800';
      case 'unavailable': return '#F44336';
      default: return '#4CAF50';
    }
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
            <Text style={styles.value}>{volunteer.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{volunteer.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{volunteer.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{volunteer.address || 'Not specified'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Skills:</Text>
            <Text style={styles.value}>{volunteer.skills || 'Not specified'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Availability:</Text>
            <View style={[styles.availabilityBadge, { backgroundColor: getAvailabilityColor(volunteer.availability) }]}>
              <Text style={styles.availabilityText}>
                {(volunteer.availability || 'available').toUpperCase()}
              </Text>
            </View>
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
            placeholder="Skills (comma-separated)"
            value={formData.skills}
            onChangeText={(text) => setFormData({ ...formData, skills: text })}
          />
          
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Availability:</Text>
            <View style={styles.pickerButtons}>
              {(['available', 'busy', 'unavailable'] as const).map((avail) => (
                <TouchableOpacity
                  key={avail}
                  style={[
                    styles.pickerButton,
                    formData.availability === avail && styles.pickerButtonActive,
                    { backgroundColor: formData.availability === avail ? getAvailabilityColor(avail) : '#f0f0f0' }
                  ]}
                  onPress={() => setFormData({ ...formData, availability: avail })}
                >
                  <Text style={[
                    styles.pickerButtonText,
                    formData.availability === avail && styles.pickerButtonTextActive
                  ]}>
                    {avail.charAt(0).toUpperCase() + avail.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
    backgroundColor: '#2196F3',
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
    alignItems: 'center',
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
  availabilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  availabilityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  pickerButtonActive: {
    // backgroundColor set dynamically
  },
  pickerButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  pickerButtonTextActive: {
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    alignItems: 'flex-start',
  },
  saveButton: {
    backgroundColor: '#2196F3',
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

export default VolunteerProfile;

