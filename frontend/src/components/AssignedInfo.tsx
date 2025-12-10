import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AssignedData } from "../services/socket";

interface Props {
  assigned: AssignedData | null;
}

const AssignedInfo: React.FC<Props> = ({ assigned }) => {
  if (!assigned) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ Request Assigned!</Text>
      <Text style={styles.text}><Text style={styles.label}>Volunteer:</Text> {assigned.volunteer_name}</Text>
      {assigned.volunteer_address && (
        <Text style={styles.text}><Text style={styles.label}>Location:</Text> {assigned.volunteer_address}</Text>
      )}
      {assigned.match_score && (
        <Text style={styles.text}><Text style={styles.label}>Match Score:</Text> {(assigned.match_score * 100).toFixed(1)}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    padding: 15,
    marginVertical: 20,
    borderRadius: 8,
    backgroundColor: '#e8f5e9',
  },
  title: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
  },
});

export default AssignedInfo;

