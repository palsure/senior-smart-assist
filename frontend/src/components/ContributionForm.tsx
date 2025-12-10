import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, FlatList } from "react-native";
import { addContribution, getVolunteers, getContributions, Volunteer, Contribution } from "../services/api";

interface ContributionFormProps {
  onTotalChange?: (total: number) => void;
}

const ContributionForm: React.FC<ContributionFormProps> = ({ onTotalChange }) => {
  const [formData, setFormData] = useState({
    contributor_name: "",
    contributor_email: "",
    amount: "",
    volunteer_id: "",
    message: "",
  });
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [totalContributions, setTotalContributions] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    loadVolunteers();
    loadContributions();
  }, []);

  const loadVolunteers = async () => {
    try {
      const response = await getVolunteers();
      setVolunteers(response.data);
    } catch (err) {
      console.error("Failed to load volunteers");
    }
  };

  const loadContributions = async () => {
    try {
      const response = await getContributions();
      setContributions(response.data);
      const total = response.data.reduce((sum: number, contribution: Contribution) => sum + contribution.amount, 0);
      setTotalContributions(total);
      if (onTotalChange) {
        onTotalChange(total);
      }
    } catch (err) {
      console.error("Failed to load contributions");
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess(false);

    if (!formData.contributor_name || !formData.contributor_email || !formData.amount) {
      setError("Name, email, and amount are required");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be greater than zero");
      return;
    }

    try {
      await addContribution({
        contributor_name: formData.contributor_name,
        contributor_email: formData.contributor_email,
        amount: amount,
        volunteer_id: formData.volunteer_id ? parseInt(formData.volunteer_id) : undefined,
        message: formData.message,
      });
      setSuccess(true);
      setFormData({
        contributor_name: "",
        contributor_email: "",
        amount: "",
        volunteer_id: "",
        message: "",
      });
      loadContributions();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add contribution");
    }
  };


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>💝 Make a Contribution</Text>
      
      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText}>
          Your generous contribution helps us support senior citizens in need by connecting them with caring volunteers.
          Every donation makes a difference in improving the quality of life for our community members.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>✓ Contribution added successfully!</Text>
        </View>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Your Name"
        value={formData.contributor_name}
        onChangeText={(text) => setFormData({ ...formData, contributor_name: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Your Email"
        value={formData.contributor_email}
        onChangeText={(text) => setFormData({ ...formData, contributor_email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Amount ($)"
        value={formData.amount}
        onChangeText={(text) => setFormData({ ...formData, amount: text })}
        keyboardType="decimal-pad"
      />

      <TextInput
        style={[styles.input, styles.messageInput]}
        placeholder="Message (Optional)"
        value={formData.message}
        onChangeText={(text) => setFormData({ ...formData, message: text })}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Contribution</Text>
      </TouchableOpacity>

      {/* Recent Contributions removed per UI request */}
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
  },
  totalContainer: {
    backgroundColor: '#FFD700',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
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
  messageInput: {
    height: 100,
    paddingTop: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  volunteerList: {
    marginBottom: 15,
  },
  volunteerOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  volunteerOptionSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  volunteerOptionText: {
    color: '#333',
  },
  volunteerOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    alignSelf: 'flex-start',
    minWidth: 150,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  contributionCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  contributionName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contributionAmount: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contributionVolunteer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  contributionMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  contributionDate: {
    fontSize: 12,
    color: '#999',
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

export default ContributionForm;

