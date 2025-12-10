import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import { socket } from "../services/socket";
import { classifyRequest, createRequest } from "../services/api";
import { RequestFormProps } from "../types";
import { requestFormStyles } from "../styles/requestFormStyles";

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

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const RequestForm: React.FC<RequestFormProps> = ({ address, elder, assigned }) => {
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(false);
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [detectedType, setDetectedType] = useState<string>("");
  const [createdRequest, setCreatedRequest] = useState<any>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');

  // Check if speech recognition is supported (web only)
  useEffect(() => {
    if (getPlatformOS() === 'web') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let newFinalTranscript = '';

          // Process only new results since last event
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              newFinalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          // Update final transcript - append new final results
          if (newFinalTranscript) {
            finalTranscriptRef.current += newFinalTranscript;
          }

          // Update description: final transcript + current interim (if any)
          const baseText = finalTranscriptRef.current.trim();
          const displayText = baseText + (interimTranscript ? ' ' + interimTranscript : '');
          setDescription(displayText);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech') {
            setError('No speech detected. Please try again.');
          } else if (event.error === 'audio-capture') {
            setError('No microphone found. Please check your microphone settings.');
          } else if (event.error === 'not-allowed') {
            setError('Microphone permission denied. Please allow microphone access.');
          } else {
            setError('Speech recognition error. Please try again.');
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onstart = () => {
          setIsListening(true);
          setError('');
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (!isSpeechSupported) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      return; // Already listening
    }

    if (recognitionRef.current) {
      try {
        // Reset final transcript when starting new session - keep existing text
        const currentText = description.trim();
        finalTranscriptRef.current = currentText;
        if (currentText && !currentText.endsWith(' ')) {
          finalTranscriptRef.current += ' ';
        }
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
        setError('Could not start voice recording. Please try again.');
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        // Clean up any trailing spaces and update final transcript
        const cleaned = description.trim();
        finalTranscriptRef.current = cleaned;
        setDescription(cleaned);
      } catch (err) {
        console.error('Error stopping recognition:', err);
        setIsListening(false);
      }
    }
  };

  const sendRequest = async () => {
    setError("");
    setSuccess("");
    
    if (!description.trim()) {
      setError("Please provide a description for your request");
      return;
    }

    try {
      setIsClassifying(true);
      const classification = await classifyRequest(description);
      const detectedType = classification.data.request_type;
      setDetectedType(detectedType);
      
      // Create request via REST API
      const response = await createRequest({
        description,
        address,
        elder_id: elder?.id,
        type: detectedType
      });
      
      setCreatedRequest(response.data);
      setDescription("");
      setDetectedType("");
      setSuccess(""); // Clear any previous success message
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send request. Please try again.");
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <ScrollView style={requestFormStyles.container} contentContainerStyle={requestFormStyles.content}>
      {error ? (
        <View style={requestFormStyles.errorContainer}>
          <Text style={requestFormStyles.errorText}>{error}</Text>
        </View>
      ) : null}
      
      {createdRequest ? (
        <View style={requestFormStyles.requestCreatedContainer}>
          <Text style={requestFormStyles.requestCreatedTitle}>✓ Request Created</Text>
          <View style={requestFormStyles.requestDetails}>
            <View style={requestFormStyles.requestDetailRow}>
              <Text style={requestFormStyles.requestDetailLabel}>Request ID: </Text>
              <Text style={requestFormStyles.requestDetailValue}>{createdRequest.id}</Text>
            </View>
            <View style={requestFormStyles.requestDetailRow}>
              <Text style={requestFormStyles.requestDetailLabel}>Request Description: </Text>
              <Text style={requestFormStyles.requestDetailValue}>{createdRequest.description}</Text>
            </View>
            <View style={requestFormStyles.requestDetailRow}>
              <Text style={requestFormStyles.requestDetailLabel}>Request Type: </Text>
              <Text style={requestFormStyles.requestDetailValue}>{createdRequest.request_type}</Text>
            </View>
            <View style={requestFormStyles.requestDetailRow}>
              <Text style={requestFormStyles.requestDetailLabel}>Request Priority: </Text>
              <Text style={requestFormStyles.requestDetailValue}>{createdRequest.priority}</Text>
            </View>
            <View style={requestFormStyles.requestDetailRow}>
              <Text style={requestFormStyles.requestDetailLabel}>Status: </Text>
              <Text style={requestFormStyles.requestDetailValue}>Waiting for Volunteer Assignment</Text>
            </View>
          </View>
        </View>
      ) : null}
      
      {detectedType && !createdRequest ? (
        <View style={requestFormStyles.detectedContainer}>
          <Text style={requestFormStyles.detectedText}>🤖 AI detected: {detectedType}</Text>
        </View>
      ) : null}
      
      <View style={requestFormStyles.formBox}>
        <Text style={requestFormStyles.title}>Submit New Request:</Text>
        
        <View style={requestFormStyles.descriptionBox}>
          <Text style={requestFormStyles.descriptionText}>
            Need help with urgent tasks, medical assistance, transportation, or companionship? 
            Describe your request in the box below by typing or using the Voice-to-Text recorder.
            {'\n\n'}
            Our smart AI system will automatically categorize and prioritize your request, and the best matching volunteer 
            in your area will assist with your request.
          </Text>
        </View>
        
        <View style={requestFormStyles.inputContainer}>
          <View style={requestFormStyles.inputWrapper}>
            <TextInput
              style={requestFormStyles.textInput}
              placeholder="Type your request or click 'Use Voice' to speak..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
            {isSpeechSupported && (
              <View style={requestFormStyles.voiceButtonAbsolute}>
                {!isListening ? (
                  <TouchableOpacity
                    style={requestFormStyles.voiceButton}
                    onPress={startListening}
                  >
                    <Text style={requestFormStyles.voiceButtonText}>🎤 Use Voice</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[requestFormStyles.voiceButton, requestFormStyles.voiceButtonActive]}
                    onPress={stopListening}
                  >
                    <Text style={requestFormStyles.voiceButtonText}>⏹️ Stop</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>


        <TouchableOpacity
          style={[requestFormStyles.submitButton, (isClassifying || !description.trim() || createdRequest) && requestFormStyles.submitButtonDisabled]}
          onPress={sendRequest}
          disabled={isClassifying || !description.trim() || !!createdRequest}
        >
          <Text style={requestFormStyles.submitButtonText}>
            {isClassifying ? "🤖 AI Processing..." : createdRequest ? "Request Submitted" : "Submit Request"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default RequestForm;

