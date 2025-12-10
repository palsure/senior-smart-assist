import { StyleSheet } from 'react-native';

// Safe Platform check
const getPlatformOS = (): string => {
  try {
    const { Platform } = require('react-native');
    if (Platform && Platform.OS) {
      return Platform.OS;
    }
  } catch (e) {
    // Platform not available
  }
  return 'android'; // Default fallback
};

export const signInStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0e0e0',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: getPlatformOS() === 'web' ? ('100vh' as any) : '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    width: '100%',
    maxWidth: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  infoBox: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 25,
    width: '100%',
  },
  infoTitle: {
    color: '#555',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  infoText: {
    color: '#666',
    fontSize: 13,
    lineHeight: 28,
    textAlign: 'left',
  },
  chooseText: {
    textAlign: 'left',
    color: '#555',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 15,
    width: '100%',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    gap: 10,
    width: '100%',
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  toggleButtonActiveElder: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  toggleButtonActiveVolunteer: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  toggleButtonActiveDonor: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  toggleText: {
    fontSize: 15,
    color: '#666',
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: '#fff',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#333',
    fontSize: 15,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  donorMessage: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e8f5e9',
    borderRadius: 5,
    width: '100%',
  },
  donorMessageTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'left',
    marginBottom: 10,
  },
  donorMessageText: {
    margin: 0,
    fontSize: 13,
    color: '#2e7d32',
    textAlign: 'left',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 5,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  button: {
    width: '70%',
    height: 50,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    alignSelf: 'center',
  },
  buttonElder: {
    backgroundColor: '#4CAF50',
  },
  buttonVolunteer: {
    backgroundColor: '#2196F3',
  },
  buttonDonor: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    alignItems: 'center',
  },
  registerText: {
    marginBottom: 15,
    color: '#666',
    fontSize: 14,
  },
  registerButton: {
    padding: 12,
    backgroundColor: '#FF9800',
    borderRadius: 5,
    width: '70%',
    alignItems: 'center',
    alignSelf: 'center',
    height: 50,
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

