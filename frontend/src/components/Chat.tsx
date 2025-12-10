import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, KeyboardAvoidingView } from "react-native";
import { getChatMessages, sendChatMessage, ChatMessage } from "../services/api";
import { socket } from "../services/socket";

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

interface ChatProps {
  visible: boolean;
  onClose: () => void;
  requestId: number;
  currentUserId: number;
  currentUserType: 'elder' | 'volunteer';
  otherUserName: string;
}

const Chat: React.FC<ChatProps> = ({ visible, onClose, requestId, currentUserId, currentUserType, otherUserName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && requestId) {
      loadMessages();
      
      // Ensure socket is connected
      if (!socket.connected) {
        socket.connect();
      }
      
      // Wait a bit for connection, then join room
      const joinRoom = () => {
        if (socket.connected) {
          socket.emit('join_chat', { request_id: requestId });
        }
      };
      
      // Try to join immediately if connected
      if (socket.connected) {
        joinRoom();
      } else {
        // Wait for connection
        socket.once('connect', joinRoom);
      }
      
      // Listen for new messages
      socket.on('new_message', handleNewMessage);
      
      // Set up polling as backup (every 3 seconds)
      const pollInterval = setInterval(() => {
        loadMessages();
      }, 3000);
      
      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('connect', joinRoom);
        if (socket.connected) {
          socket.emit('leave_chat', { request_id: requestId });
        }
        clearInterval(pollInterval);
      };
    }
  }, [visible, requestId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getChatMessages(requestId);
      // Sort messages by timestamp to ensure correct order
      const sortedMessages = response.data.sort((a: ChatMessage, b: ChatMessage) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      });
      setMessages(sortedMessages);
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.response?.data?.error || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message: ChatMessage) => {
    // Only add if message is for this request
    if (message.request_id === requestId) {
      setMessages(prev => {
        // Avoid duplicates by checking message ID
        const existingMessage = prev.find(m => m.id === message.id);
        if (existingMessage) {
          return prev;
        }
        // Add new message and sort by timestamp to ensure correct order
        const updated = [...prev, message];
        updated.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB;
        });
        return updated;
      });
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX

    // Optimistically add message to UI for immediate feedback
    const tempMessage: ChatMessage = {
      id: Date.now(), // Temporary ID
      request_id: requestId,
      sender_id: currentUserId,
      sender_type: currentUserType,
      message: messageText,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => {
      const updated = [...prev, tempMessage];
      updated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return updated;
    });

    try {
      setError("");
      const response = await sendChatMessage(requestId, currentUserId, currentUserType, messageText);
      
      // Replace temp message with real one from server
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempMessage.id);
        const updated = [...filtered, response.data];
        updated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        return updated;
      });
      
      // Reload messages after a short delay to ensure both parties see the same messages
      // This helps if WebSocket isn't working
      setTimeout(() => {
        loadMessages();
      }, 1000);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.error || 'Failed to send message');
      // Remove temp message and restore input
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageText);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={getPlatformOS() === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        {isMinimized ? (
          // Minimized view - small chat bubble
          <View style={styles.minimizedContainer}>
            <TouchableOpacity
              style={styles.minimizedHeader}
              onPress={() => setIsMinimized(false)}
            >
              <Text style={styles.minimizedTitle}>Chat with {otherUserName}</Text>
              <View style={styles.minimizedButtons}>
                <TouchableOpacity
                  onPress={() => setIsMinimized(false)}
                  style={styles.minimizeButton}
                >
                  <Text style={styles.minimizeButtonText}>□</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            {messages.length > 0 && (
              <View style={styles.minimizedMessagePreview}>
                <Text style={styles.minimizedMessageText} numberOfLines={1}>
                  {messages[messages.length - 1].message}
                </Text>
              </View>
            )}
          </View>
        ) : (
          // Maximized view - full chat window
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Chat with {otherUserName}</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  onPress={() => setIsMinimized(true)}
                  style={styles.minimizeButton}
                >
                  <Text style={styles.minimizeButtonText}>_</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {loading && messages.length === 0 ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading messages...</Text>
              </View>
            ) : (
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
              >
                {messages.map((message) => {
                  const isOwnMessage = message.sender_id === currentUserId && message.sender_type === currentUserType;
                  return (
                    <View
                      key={message.id}
                      style={[
                        styles.messageBubble,
                        isOwnMessage ? styles.ownMessage : styles.otherMessage
                      ]}
                    >
                      <Text style={[
                        styles.messageText,
                        isOwnMessage ? styles.ownMessageText : styles.otherMessageText
                      ]}>
                        {message.message}
                      </Text>
                      <Text style={[
                        styles.messageTime,
                        isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
                      ]}>
                        {formatTime(message.timestamp)}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type a message..."
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!newMessage.trim()}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    height: 500,
    width: 400,
    maxWidth: '90%',
    maxHeight: '70%',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  minimizedContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 350,
    maxWidth: '85%',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  minimizedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#4CAF50',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  minimizedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  minimizedButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimizedMessagePreview: {
    padding: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  minimizedMessageText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#4CAF50',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimizeButton: {
    padding: 5,
    marginRight: 10,
  },
  minimizeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  errorText: {
    color: '#c62828',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messagesContent: {
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 10,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default Chat;

