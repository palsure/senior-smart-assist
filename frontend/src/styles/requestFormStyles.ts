import { StyleSheet } from 'react-native';

export const requestFormStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  formBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
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
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ef5350',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  successText: {
    color: '#2e7d32',
    fontSize: 14,
  },
  detectedContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  detectedText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  textInput: {
    width: '100%',
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    paddingRight: 120,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  voiceButtonAbsolute: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  voiceButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2196F3',
    borderRadius: 6,
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#f44336',
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 6,
    alignItems: 'flex-start',
    marginTop: 20,
    alignSelf: 'flex-start',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestCreatedContainer: {
    backgroundColor: '#e8f5e9',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  requestCreatedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  requestDetails: {
    marginTop: 0,
  },
  requestDetailRow: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  requestDetailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  requestDetailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

