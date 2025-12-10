import React, { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal } from "react-native";
import { getRequests, updateRequestStatus, updateRequest, rateVolunteer, HelpRequest, API, ChatMessage } from "../services/api";
import Chat from "./Chat";
import { socket } from "../services/socket";

// Safe Platform check function
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

const isWebPlatform = (): boolean => {
  return getPlatformOS() === 'web';
};

interface RequestListProps {
  isVolunteerView?: boolean;
  currentVolunteerId?: number;
  currentUserId?: number;
  currentUserType?: 'elder' | 'volunteer';
  showMyRequests?: boolean; // For volunteer's assigned/completed requests
}

const RequestList: React.FC<RequestListProps> = ({ isVolunteerView = false, currentVolunteerId, currentUserId, currentUserType, showMyRequests = false }) => {
  // Check if we're on web platform (lazy check using ref to avoid issues during module load)
  const isWebRef = useRef<boolean | null>(null);
  if (isWebRef.current === null) {
    isWebRef.current = isWebPlatform();
  }
  const isWeb = isWebRef.current;

  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [editingRequest, setEditingRequest] = useState<HelpRequest | null>(null);
  const [editDescription, setEditDescription] = useState<string>("");
  const [editAddress, setEditAddress] = useState<string>("");
  const [editPriority, setEditPriority] = useState<string>("Normal");
  const [editType, setEditType] = useState<string>("");
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [showTypeDropdown, setShowTypeDropdown] = useState<boolean>(false);
  const [newTypeInput, setNewTypeInput] = useState<string>("");
  const [showNewTypeInput, setShowNewTypeInput] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [requestToCancel, setRequestToCancel] = useState<number | null>(null);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [chatRequestId, setChatRequestId] = useState<number | null>(null);
  const [chatOtherUserName, setChatOtherUserName] = useState<string>("");
  const [statusUpdateRequestId, setStatusUpdateRequestId] = useState<number | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);
  const [ratingRequestId, setRatingRequestId] = useState<number | null>(null);
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState<string>("");
  const [maxDistance, setMaxDistance] = useState<number>(50); // Default 50 miles
  const [distanceInput, setDistanceInput] = useState<string>("50");
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [requestToAccept, setRequestToAccept] = useState<number | null>(null);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [wantsReward, setWantsReward] = useState<boolean>(false);
  const [newMessageNotification, setNewMessageNotification] = useState<{requestId: number, senderName: string, message: string} | null>(null);
  const activeRequestIdsRef = useRef<Set<number>>(new Set()); // Track requests user is involved in
  const [hoveredComment, setHoveredComment] = useState<{requestId: number, comment: string, x: number, y: number} | null>(null);
  
  // Predefined request types
  const requestTypes = [
    "Groceries",
    "Medical Assistance",
    "Transportation",
    "Commute Assistance",
    "House Shifting",
    "Home Maintenance",
    "Companionship",
    "Technology Help",
    "Other"
  ];

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [isVolunteerView, currentVolunteerId, showMyRequests, maxDistance]);

  // Set up global chat message listener for notifications
  useEffect(() => {
    // Update active request IDs when requests change
    activeRequestIdsRef.current = new Set(
      requests
        .filter((r: HelpRequest) => {
          if (isVolunteerView) {
            // For volunteers: requests they're assigned to or can chat about
            return r.volunteer_id === currentVolunteerId && 
                   (r.status === 'assigned' || r.status === 'in_progress');
          } else {
            // For elders: requests they created that are assigned
            return r.elder_id === currentUserId && 
                   r.volunteer_id && 
                   (r.status === 'assigned' || r.status === 'in_progress');
          }
        })
        .map((r: HelpRequest) => r.id)
    );

    // Join chat rooms for all active requests
    if (socket.connected) {
      activeRequestIdsRef.current.forEach((requestId) => {
        socket.emit('join_chat', { request_id: requestId });
      });
    }

    // Listen for new messages globally
    const handleNewMessage = (message: ChatMessage) => {
      // Only show notification if:
      // 1. Message is for a request we're involved in
      // 2. Message is not from us
      // 3. Chat window is not currently open for this request
      if (
        activeRequestIdsRef.current.has(message.request_id) &&
        !(message.sender_id === currentUserId && message.sender_type === currentUserType) &&
        !(showChat && chatRequestId === message.request_id)
      ) {
        // Find the other person's name
        const request = requests.find((r: HelpRequest) => r.id === message.request_id);
        let senderName = 'Someone';
        if (request) {
          if (isVolunteerView) {
            senderName = request.elder_name || 'Senior Citizen';
          } else {
            senderName = request.volunteer_name || 'Volunteer';
          }
        }
        
        setNewMessageNotification({
          requestId: message.request_id,
          senderName: senderName,
          message: message.message
        });
      }
    };

    if (socket.connected) {
      socket.on('new_message', handleNewMessage);
    }

    return () => {
      if (socket.connected) {
        socket.off('new_message', handleNewMessage);
        // Leave all chat rooms
        activeRequestIdsRef.current.forEach((requestId) => {
          socket.emit('leave_chat', { request_id: requestId });
        });
      }
    };
  }, [requests, currentUserId, currentUserType, isVolunteerView, currentVolunteerId, showChat, chatRequestId]);

  const loadData = async () => {
    try {
      // Pass volunteer_id when viewing available requests to calculate distances
      const volunteerIdForDistance = (isVolunteerView && !showMyRequests && currentVolunteerId) 
        ? currentVolunteerId 
        : undefined;
      const reqRes = await getRequests(volunteerIdForDistance);
      let filteredRequests = reqRes.data;
      
      // For volunteer view
      if (isVolunteerView) {
        if (showMyRequests) {
          // Show only requests assigned to this volunteer (assigned, in_progress, or completed)
          filteredRequests = reqRes.data.filter((request: HelpRequest) => {
            return request.volunteer_id === currentVolunteerId && 
                   (request.status === 'assigned' || 
                    request.status === 'in_progress' || 
                    request.status === 'completed');
          });
        } else {
          // Available Requests: filter out cancelled, completed, and requests assigned to other volunteers
          filteredRequests = reqRes.data.filter((request: HelpRequest) => {
            // Exclude cancelled and completed requests
            if (request.status === 'cancelled' || request.status === 'completed') {
              return false;
            }
            // Only show pending requests (not assigned to anyone)
            if (request.status !== 'pending' || request.volunteer_id) {
              return false;
            }
            // Filter by distance: don't show if distance is more than maxDistance (capped at 100 miles)
            const distance = (request as any).distance_miles;
            if (distance !== undefined && distance !== null) {
              // Don't show requests beyond 100 miles
              if (distance > 100) {
                return false;
              }
              // Filter by maxDistance (default 50, user can change)
              if (distance > maxDistance) {
                return false;
              }
            }
            return true;
          });
        }
      }
      
      // Sort requests in descending order (newest first) - already sorted by backend, but ensure it
      filteredRequests.sort((a: HelpRequest, b: HelpRequest) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA; // Descending order
      });
      
      setRequests(filteredRequests);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load data");
      setLoading(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'assigned': return '#2196F3';
      case 'in_progress': return '#9C27B0';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const handleCancel = (requestId: number) => {
    setRequestToCancel(requestId);
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    if (requestToCancel === null) return;
    
    try {
      setError('');
      setSuccess('');
      setShowCancelConfirm(false);
      
      await updateRequestStatus(requestToCancel, 'cancelled');
      await loadData();
      setSuccess('Request cancelled successfully');
      setTimeout(() => setSuccess(''), 3000);
      setRequestToCancel(null);
    } catch (err: any) {
      console.error('Error cancelling request:', err);
      setError(err.response?.data?.error || err.message || 'Failed to cancel request. Please try again.');
      setTimeout(() => setError(''), 5000);
      setRequestToCancel(null);
    }
  };

  const handleCancelConfirmClose = () => {
    setShowCancelConfirm(false);
    setRequestToCancel(null);
  };

  const handleAccept = async (requestId: number) => {
    if (!currentVolunteerId) {
      setError('Volunteer ID not found');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      await API.post(`/request/${requestId}/accept`, {
        volunteer_id: currentVolunteerId
      });

      await loadData();
      setSuccess('Request accepted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error accepting request:', err);
      setError(err.response?.data?.error || err.message || 'Failed to accept request. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleRelease = async (requestId: number) => {
    try {
      setError('');
      setSuccess('');
      
      // Release request by setting status to pending (backend will clear volunteer_id)
      await updateRequestStatus(requestId, 'pending');
      await loadData();
      setSuccess('Request released successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error releasing request:', err);
      setError(err.response?.data?.error || err.message || 'Failed to release request. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleRate = (request: HelpRequest) => {
    setRatingRequestId(request.id);
    setSelectedRating((request as any).rating || 0);
    setRatingComment((request as any).rating_comment || '');
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!ratingRequestId || selectedRating === 0) {
      setError('Please select a rating');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setError('');
      setSuccess('');
      await rateVolunteer(ratingRequestId, selectedRating, ratingComment);
      await loadData();
      setSuccess('Rating submitted successfully!');
      setShowRatingModal(false);
      setRatingRequestId(null);
      setSelectedRating(0);
      setRatingComment('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error submitting rating:', err);
      setError(err.response?.data?.error || err.message || 'Failed to submit rating. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleUpdateStatus = (requestId: number, newStatus: string) => {
    // If completing, show reward modal first
    if (newStatus === 'completed') {
      const request = requests.find((r: HelpRequest) => r.id === requestId);
      if (!request) {
        setError('Request not found');
        return;
      }
      
      // Calculate estimated reward amount
      const priority = (request as any).priority || 'Normal';
      const priorityRewards: { [key: string]: number } = {
        'Urgent': 50.0,
        'High': 30.0,
        'Medium': 20.0,
        'Normal': 10.0
      };
      const baseReward = priorityRewards[priority] || 10.0;
      
      const requestType = request.request_type || 'Other';
      const typeMultipliers: { [key: string]: number } = {
        'Medical Assistance': 1.5,
        'Transportation': 1.2,
        'Home Maintenance': 1.3,
        'House Shifting': 1.4,
        'Technology Help': 1.1,
        'Groceries': 1.0,
        'Commute Assistance': 1.0,
        'Companionship': 0.9,
        'Other': 1.0
      };
      const multiplier = typeMultipliers[requestType] || 1.0;
      const estimatedReward = Math.round(baseReward * multiplier * 100) / 100;
      
      setRequestToAccept(requestId);
      setRewardAmount(estimatedReward);
      setWantsReward(false);
      setShowRewardModal(true);
      setShowStatusDropdown(false);
      setStatusUpdateRequestId(null);
    } else {
      // For other status updates, proceed directly
      handleConfirmStatusUpdate(requestId, newStatus);
    }
  };

  const handleConfirmStatusUpdate = async (requestId: number, newStatus: string) => {
    try {
      setError('');
      setSuccess('');
      // Close the status dropdown modal
      setShowStatusDropdown(false);
      setStatusUpdateRequestId(null);
      
      const response = await updateRequestStatus(requestId, newStatus, wantsReward);
      await loadData();
      
      const statusMessages: { [key: string]: string } = {
        'assigned': 'Request marked as assigned!',
        'in_progress': 'Request marked as in progress!',
        'completed': wantsReward && response.data.reward_assigned 
          ? `Request completed! Reward of $${response.data.reward_amount.toFixed(2)} has been assigned.`
          : wantsReward && !response.data.reward_assigned
          ? 'Request completed! However, reward could not be assigned due to insufficient donation balance.'
          : 'Request marked as completed!',
        'pending': 'Request released successfully!'
      };
      
      setSuccess(statusMessages[newStatus] || 'Request status updated!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error updating request status:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update request status. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleConfirmComplete = async () => {
    if (requestToAccept === null) return;
    
    await handleConfirmStatusUpdate(requestToAccept, 'completed');
    setShowRewardModal(false);
    setRequestToAccept(null);
    setWantsReward(false);
  };

  const getAvailableStatuses = (currentStatus: string) => {
    const statusOptions: { [key: string]: string[] } = {
      'assigned': ['in_progress', 'completed', 'pending'], // pending = release/unassign
      'in_progress': ['completed', 'pending'], // pending = release/unassign
      'pending': ['assigned', 'in_progress'],
    };
    return statusOptions[currentStatus] || [];
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'assigned': 'Assigned',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'pending': 'Release/Unassign',
    };
    return labels[status] || status;
  };

  const handleEdit = (request: HelpRequest) => {
    if (request.status === 'cancelled' || request.status === 'completed') {
      setError('Cannot edit cancelled or completed requests.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setEditingRequest(request);
    setEditDescription(request.description || '');
    setEditAddress(request.address || '');
    const priority = (request as any).priority || 'Normal';
    setEditPriority(priority);
    setEditType(request.request_type || '');
    // Calculate initial due date from priority
    const dueDate = calculateDueDate(priority, request.timestamp);
    setEditDueDate(dueDate);
  };

  // Recalculate due date when priority changes (optional - user can override)
  const handlePriorityChange = (newPriority: string) => {
    setEditPriority(newPriority);
    // Optionally suggest a new due date, but user can edit it
    if (editingRequest) {
      const suggestedDueDate = calculateDueDate(newPriority, editingRequest.timestamp);
      // Only auto-update if user hasn't manually edited it
      if (!editDueDate || editDueDate === calculateDueDate(editPriority, editingRequest.timestamp)) {
        setEditDueDate(suggestedDueDate);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRequest) return;
    
    if (!editDescription.trim()) {
      setError('Description is required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      await updateRequest(editingRequest.id, {
        description: editDescription.trim(),
        address: editAddress.trim() || undefined,
        type: editType.trim() || undefined,
        priority: editPriority,
      });
      setEditingRequest(null);
      setEditDescription('');
      setEditAddress('');
      setEditPriority('Normal');
      setEditType('');
      setEditDueDate('');
      setShowTypeDropdown(false);
      setShowNewTypeInput(false);
      setNewTypeInput('');
      loadData();
      setSuccess('Request updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update request');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCancelEdit = () => {
    setEditingRequest(null);
    setEditDescription('');
    setEditAddress('');
    setEditPriority('Normal');
    setEditType('');
    setEditDueDate('');
    setShowTypeDropdown(false);
    setShowNewTypeInput(false);
    setNewTypeInput('');
  };

  const calculateDueDate = (priority: string, timestamp: string): string => {
    try {
      const createdDate = new Date(timestamp);
      if (isNaN(createdDate.getTime())) {
        return 'N/A';
      }
      
      let daysToAdd = 7; // Default: 7 days for Normal priority
      
      if (priority === 'Urgent') {
        daysToAdd = 0; // Same day for Urgent priority
      } else if (priority === 'High') {
        daysToAdd = 1; // 1 day for High priority
      } else if (priority === 'Medium') {
        daysToAdd = 3; // 3 days for Medium priority
      }
      
      const dueDate = new Date(createdDate);
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      return dueDate.toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'Urgent': return '#D32F2F'; // Dark red
      case 'High': return '#F44336'; // Red
      case 'Medium': return '#FF9800'; // Orange
      case 'Normal': return '#4CAF50'; // Green
      default: return '#666'; // Gray
    }
  };

  const renderRequest = ({ item }: { item: HelpRequest }) => {
    const priority = (item as any).priority || 'Normal';
    const dueDate = calculateDueDate(priority, item.timestamp);
    const priorityColor = getPriorityColor(priority);
    const isAssignedToMe = item.volunteer_id === currentVolunteerId;
    const isElderView = currentUserType === 'elder';
    const isVolunteerAssigned = item.volunteer_id && item.volunteer_name;
    const requesterName = item.elder_name || 'Senior Citizen';
    const assignedVolunteerName = item.volunteer_name || 'N/A';
    const assignedVolunteerGender = item.volunteer_gender;
    
    return (
      <View style={styles.tableRow}>
        <View style={[styles.tableCell, styles.idCell]}>
          <Text style={styles.cellText}>{item.id}</Text>
        </View>
        <View style={[styles.tableCell, styles.typeCell]}>
          <Text style={styles.cellText}>{item.request_type || 'N/A'}</Text>
        </View>
        <View style={[styles.tableCell, styles.descriptionCell]}>
          <Text style={styles.cellText}>{item.description || 'No description'}</Text>
        </View>
        <View style={[styles.tableCell, styles.priorityCell]}>
          <Text style={[styles.cellText, { color: priorityColor, fontWeight: 'bold' }]}>
            {priority}
          </Text>
        </View>
        <View style={[styles.tableCell, styles.createdCell]}>
          <Text style={styles.cellText}>
            {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        <View style={[styles.tableCell, styles.dueCell]}>
          <Text style={styles.cellText}>{dueDate}</Text>
        </View>
        <View style={[styles.tableCell, styles.statusCell]}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={[styles.tableCell, styles.assignedCell]}>
          {isVolunteerView ? (
            // Volunteer view: Show requester (elder) name
            <View style={styles.assignedContainer}>
              <Text style={styles.genderIcon}>👤</Text>
              <Text style={styles.assignedName}>{requesterName}</Text>
              {isAssignedToMe && (item.status === 'assigned' || item.status === 'in_progress') && (
                <TouchableOpacity
                  style={styles.chatButton}
                  onPress={() => {
                    setChatRequestId(item.id);
                    setChatOtherUserName(requesterName);
                    setShowChat(true);
                  }}
                >
                  <Text style={styles.chatIcon}>💬</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // Elder view: Show assigned volunteer
            isVolunteerAssigned ? (
              <View style={styles.assignedContainer}>
                <Text style={styles.genderIcon}>
                  {assignedVolunteerGender === 'Male' ? '👨' : 
                   assignedVolunteerGender === 'Female' ? '👩' : 
                   assignedVolunteerGender === 'Other' ? '🧑' : '👤'}
                </Text>
                <Text style={styles.assignedName}>{assignedVolunteerName}</Text>
                {isElderView && (item.status === 'assigned' || item.status === 'in_progress') && (
                  <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() => {
                      setChatRequestId(item.id);
                      setChatOtherUserName(assignedVolunteerName);
                      setShowChat(true);
                    }}
                  >
                    <Text style={styles.chatIcon}>💬</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text style={styles.notAssignedText}>Not assigned</Text>
            )
          )}
        </View>
        {isVolunteerView && (
          <View style={[styles.tableCell, styles.rewardCell]}>
            {item.status === 'completed' ? (
              <View style={styles.rewardColumnContent}>
                {(item as any).reward_amount ? (
                  <Text style={[styles.cellText, styles.rewardAmount]}>
                    ${((item as any).reward_amount as number).toFixed(2)}
                  </Text>
                ) : (
                  <Text style={styles.cellText}>-</Text>
                )}
                {(item as any).rating ? (
                  <View style={styles.ratingInRewardColumn}>
                    <Text style={styles.ratingStars}>
                      {'⭐'.repeat((item as any).rating || 0)}
                    </Text>
                    {(item as any).rating_comment && (
                      <View
                        style={styles.ratingCommentContainer}
                        {...(isWeb ? {
                          // @ts-ignore - React Native Web supports onMouseEnter/onMouseLeave
                          onMouseEnter: (e: any) => {
                            try {
                              if ((item as any).rating_comment && e && e.currentTarget && typeof e.currentTarget.getBoundingClientRect === 'function') {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredComment({
                                  requestId: item.id,
                                  comment: (item as any).rating_comment,
                                  x: rect.left + rect.width / 2,
                                  y: rect.top - 10
                                });
                              }
                            } catch (err) {
                              // Silently fail on mobile/Android
                              console.warn('Tooltip positioning failed:', err);
                            }
                          },
                          // @ts-ignore - React Native Web supports onMouseEnter/onMouseLeave
                          onMouseLeave: () => {
                            setHoveredComment(null);
                          }
                        } : {})}
                      >
                        <Text style={styles.ratingCommentPreview} numberOfLines={1}>
                          "{(item as any).rating_comment}"
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            ) : (
              <Text style={styles.cellText}>-</Text>
            )}
          </View>
        )}
        <View style={[styles.tableCell, styles.actionCell]}>
          {isVolunteerView ? (
            // Volunteer view
            !showMyRequests && item.status === 'pending' && !item.volunteer_id ? (
              // Available Requests: Show Accept button
              <TouchableOpacity onPress={() => handleAccept(item.id)}>
                <Text style={styles.acceptLink}>Accept</Text>
              </TouchableOpacity>
            ) : showMyRequests ? (
              // My Requests: Show Update Status option
              isAssignedToMe ? (
                <View style={styles.actionButtonsContainer}>
                  {item.status !== 'completed' ? (
                    <TouchableOpacity onPress={() => {
                      setStatusUpdateRequestId(item.id);
                      setShowStatusDropdown(true);
                    }}>
                      <Text style={styles.updateStatusLink}>Update Status</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.completedText}>Completed</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.notAssignedText}>-</Text>
              )
            ) : null
          ) : (
            // Elder view: Show Edit/Cancel buttons
            <>
              {item.status !== 'cancelled' && item.status !== 'completed' && (
                <View style={styles.actionLinks}>
                  <TouchableOpacity onPress={() => handleEdit(item)}>
                    <Text style={styles.editLink}>Edit</Text>
                  </TouchableOpacity>
                  <Text style={styles.linkSeparator}> | </Text>
                  <TouchableOpacity onPress={() => handleCancel(item.id)}>
                    <Text style={styles.cancelLink}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
              {item.status === 'cancelled' && (
                <Text style={styles.cancelledText}>Cancelled</Text>
              )}
              {item.status === 'completed' && (
                <View style={styles.completedActionContainer}>
                  {(item as any).rating ? (
                    <View style={styles.ratingDisplayContainer}>
                      <Text style={styles.ratingStars}>
                        {'⭐'.repeat((item as any).rating || 0)}
                      </Text>
                      <Text style={styles.ratedText}>Rated</Text>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => handleRate(item)}>
                      <Text style={styles.rateLink}>Rate Volunteer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      
      {success ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      ) : null}

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelConfirmClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalTitle}>Cancel Request</Text>
            <Text style={styles.confirmModalMessage}>
              Are you sure you want to cancel this request? This action cannot be undone.
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.confirmModalButtonCancel]}
                onPress={handleCancelConfirmClose}
              >
                <Text style={styles.confirmModalButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.confirmModalButtonConfirm]}
                onPress={handleConfirmCancel}
              >
                <Text style={[styles.confirmModalButtonText, styles.confirmModalButtonTextConfirm]}>
                  Yes, Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Request Modal */}
      <Modal
        visible={editingRequest !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Request</Text>
            
            <Text style={styles.label}>Request Description *</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Enter request description"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.singleLineInput]}
              value={editAddress}
              onChangeText={setEditAddress}
              placeholder="Enter address (optional)"
            />

            <Text style={styles.label}>Request Type</Text>
            <TouchableOpacity
              style={[styles.input, styles.singleLineInput, styles.dropdownButton]}
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <Text style={[styles.dropdownButtonText, !editType && styles.placeholderText]}>
                {editType || 'Select request type'}
              </Text>
              <Text style={styles.dropdownArrow}>{showTypeDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            
            {showTypeDropdown && (
              <View style={styles.dropdownContainer}>
                <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                  {requestTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.dropdownItem, editType === type && styles.dropdownItemSelected]}
                      onPress={() => {
                        setEditType(type);
                        setShowTypeDropdown(false);
                        setShowNewTypeInput(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, editType === type && styles.dropdownItemTextSelected]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setShowNewTypeInput(true);
                      setShowTypeDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: '#2196F3', fontStyle: 'italic' }]}>
                      + Add New Type
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
            
            {showNewTypeInput && (
              <View style={styles.newTypeContainer}>
                <TextInput
                  style={[styles.input, styles.singleLineInput]}
                  value={newTypeInput}
                  onChangeText={setNewTypeInput}
                  placeholder="Enter new request type"
                  autoFocus
                />
                <View style={styles.newTypeButtons}>
                  <TouchableOpacity
                    style={[styles.newTypeButton, styles.cancelNewTypeButton]}
                    onPress={() => {
                      setShowNewTypeInput(false);
                      setNewTypeInput('');
                    }}
                  >
                    <Text style={styles.newTypeButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.newTypeButton, styles.addNewTypeButton]}
                    onPress={() => {
                      if (newTypeInput.trim()) {
                        setEditType(newTypeInput.trim());
                        setShowNewTypeInput(false);
                        setNewTypeInput('');
                      }
                    }}
                  >
                    <Text style={styles.newTypeButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.label}>Priority</Text>
            <View style={styles.prioritySelector}>
              <TouchableOpacity
                style={[styles.priorityOption, editPriority === 'Urgent' && styles.priorityOptionSelected, { backgroundColor: editPriority === 'Urgent' ? '#D32F2F' : '#fff', borderColor: '#D32F2F' }]}
                onPress={() => handlePriorityChange('Urgent')}
              >
                <Text style={[styles.priorityOptionText, editPriority === 'Urgent' && styles.priorityOptionTextSelected, { color: editPriority === 'Urgent' ? '#fff' : '#D32F2F' }]}>
                  Urgent
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.priorityOption, editPriority === 'High' && styles.priorityOptionSelected, { backgroundColor: editPriority === 'High' ? '#F44336' : '#fff', borderColor: '#F44336' }]}
                onPress={() => handlePriorityChange('High')}
              >
                <Text style={[styles.priorityOptionText, editPriority === 'High' && styles.priorityOptionTextSelected, { color: editPriority === 'High' ? '#fff' : '#F44336' }]}>
                  High
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.priorityOption, editPriority === 'Medium' && styles.priorityOptionSelected, { backgroundColor: editPriority === 'Medium' ? '#FF9800' : '#fff', borderColor: '#FF9800' }]}
                onPress={() => handlePriorityChange('Medium')}
              >
                <Text style={[styles.priorityOptionText, editPriority === 'Medium' && styles.priorityOptionTextSelected, { color: editPriority === 'Medium' ? '#fff' : '#FF9800' }]}>
                  Medium
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.priorityOption, editPriority === 'Normal' && styles.priorityOptionSelected, { backgroundColor: editPriority === 'Normal' ? '#4CAF50' : '#fff', borderColor: '#4CAF50' }]}
                onPress={() => handlePriorityChange('Normal')}
              >
                <Text style={[styles.priorityOptionText, editPriority === 'Normal' && styles.priorityOptionTextSelected, { color: editPriority === 'Normal' ? '#fff' : '#4CAF50' }]}>
                  Normal
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Request Due Date</Text>
            <TextInput
              style={[styles.input, styles.singleLineInput]}
              value={editDueDate}
              onChangeText={setEditDueDate}
              placeholder="MM/DD/YYYY"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={handleCancelEdit}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reward Confirmation Modal */}
      <Modal
        visible={showRewardModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowRewardModal(false);
          setRequestToAccept(null);
          setWantsReward(false);
        }}
      >
        <TouchableOpacity
          style={styles.statusModalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowRewardModal(false);
            setRequestToAccept(null);
            setWantsReward(false);
          }}
        >
          <View style={styles.rewardModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.rewardModalTitle}>Complete Request</Text>
            <Text style={styles.rewardModalSubtitle}>
              Estimated reward for completing this request: ${rewardAmount.toFixed(2)}
            </Text>
            <Text style={styles.rewardModalQuestion}>
              Would you like to receive a reward from the donation balance?
            </Text>
            
            <View style={styles.rewardOptionsContainer}>
              <TouchableOpacity
                style={[styles.rewardOption, wantsReward && styles.rewardOptionSelected]}
                onPress={() => setWantsReward(true)}
              >
                <View style={styles.radioCircle}>
                  {wantsReward && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.rewardOptionText}>Yes, I'd like the reward</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.rewardOption, !wantsReward && styles.rewardOptionSelected]}
                onPress={() => setWantsReward(false)}
              >
                <View style={styles.radioCircle}>
                  {!wantsReward && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.rewardOptionText}>No, I'll volunteer without reward</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.rewardModalButtons}>
              <TouchableOpacity
                style={[styles.rewardModalButton, styles.rewardModalCancelButton]}
                onPress={() => {
                  setShowRewardModal(false);
                  setRequestToAccept(null);
                  setWantsReward(false);
                }}
              >
                <Text style={styles.rewardModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rewardModalButton, styles.rewardModalConfirmButton]}
                onPress={handleConfirmComplete}
              >
                <Text style={[styles.rewardModalButtonText, styles.rewardModalConfirmButtonText]}>
                  Complete Request
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Distance Filter for Available Requests */}
      {isVolunteerView && !showMyRequests && (
        <View style={styles.distanceFilterContainer}>
          <Text style={styles.distanceFilterLabel}>Filter by Distance (miles):</Text>
          <TextInput
            style={styles.distanceFilterInput}
            value={distanceInput}
            onChangeText={(text) => {
              setDistanceInput(text);
              const numValue = parseFloat(text);
              if (!isNaN(numValue) && numValue >= 0) {
                // Cap at 100 miles
                const cappedValue = Math.min(numValue, 100);
                setMaxDistance(cappedValue);
                if (cappedValue < numValue) {
                  setDistanceInput(cappedValue.toString());
                }
              }
            }}
            keyboardType="numeric"
            placeholder="50"
            maxLength={3}
          />
          <Text style={styles.distanceFilterNote}>
            (Max: 100 miles. Requests beyond 100 miles are hidden)
          </Text>
        </View>
      )}

      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No requests yet.</Text>
        </View>
      ) : (
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableCell, styles.idCell]}>
              <Text style={styles.headerText}>Request#</Text>
            </View>
            <View style={[styles.tableCell, styles.typeCell]}>
              <Text style={styles.headerText}>Category</Text>
            </View>
            <View style={[styles.tableCell, styles.descriptionCell]}>
              <Text style={styles.headerText}>Request Description</Text>
            </View>
            <View style={[styles.tableCell, styles.priorityCell]}>
              <Text style={styles.headerText}>Priority</Text>
            </View>
            <View style={[styles.tableCell, styles.createdCell]}>
              <Text style={styles.headerText}>Created</Text>
            </View>
            <View style={[styles.tableCell, styles.dueCell]}>
              <Text style={styles.headerText}>Request Due</Text>
            </View>
            <View style={[styles.tableCell, styles.statusCell]}>
              <Text style={styles.headerText}>Status</Text>
            </View>
            <View style={[styles.tableCell, styles.assignedCell]}>
              <Text style={styles.headerText}>{isVolunteerView ? 'Requested By' : 'Assigned To'}</Text>
            </View>
            {isVolunteerView && (
              <View style={[styles.tableCell, styles.rewardCell]}>
                <Text style={styles.headerText}>Reward</Text>
              </View>
            )}
            <View style={[styles.tableCell, styles.actionCell]}>
              <Text style={styles.headerText}>Action</Text>
            </View>
          </View>
          {/* Table Rows */}
          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={true}
          />
        </View>
      )}

      {/* Rating Comment Tooltip */}
      {hoveredComment && isWeb && (
        <View 
          style={[
            styles.tooltip,
            {
              position: 'absolute',
              left: hoveredComment.x - 150,
              top: hoveredComment.y - 60,
              zIndex: 10000,
            }
          ]}
          {...(isWeb ? {
            // @ts-ignore - React Native Web supports onMouseEnter/onMouseLeave
            onMouseEnter: () => {}, // Keep tooltip visible when hovering over it
            // @ts-ignore - React Native Web supports onMouseEnter/onMouseLeave
            onMouseLeave: () => setHoveredComment(null)
          } : {})}
        >
          <Text style={styles.tooltipText}>{hoveredComment.comment}</Text>
          <View style={styles.tooltipArrow} />
        </View>
      )}

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowRatingModal(false);
          setRatingRequestId(null);
          setSelectedRating(0);
          setRatingComment('');
        }}
      >
        <View
          style={styles.statusModalOverlay}
          onStartShouldSetResponder={() => true}
          onResponderGrant={() => {
            setShowRatingModal(false);
            setRatingRequestId(null);
            setSelectedRating(0);
            setRatingComment('');
          }}
        >
          <View 
            style={styles.ratingModalContent} 
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
          >
            <Text style={styles.statusModalTitle}>Rate Volunteer</Text>
            <Text style={styles.ratingSubtitle}>How would you rate this volunteer's service?</Text>
            
            <View style={styles.ratingStarsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSelectedRating(star)}
                  style={styles.starButton}
                >
                  <Text style={styles.starIcon}>
                    {star <= selectedRating ? '⭐' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.label}>Optional Comment</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={ratingComment}
              onChangeText={setRatingComment}
              placeholder="Share your experience (optional)"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            
            <View style={styles.ratingModalButtons}>
              <TouchableOpacity
                style={[styles.ratingModalButton, styles.ratingModalCancelButton]}
                onPress={() => {
                  setShowRatingModal(false);
                  setRatingRequestId(null);
                  setSelectedRating(0);
                  setRatingComment('');
                }}
              >
                <Text style={styles.ratingModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ratingModalButton, styles.ratingModalSubmitButton]}
                onPress={handleSubmitRating}
              >
                <Text style={[styles.ratingModalButtonText, styles.ratingModalSubmitButtonText]}>
                  Submit Rating
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Update Dropdown Modal */}
      <Modal
        visible={showStatusDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowStatusDropdown(false);
          setStatusUpdateRequestId(null);
        }}
      >
        <TouchableOpacity
          style={styles.statusModalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowStatusDropdown(false);
            setStatusUpdateRequestId(null);
          }}
        >
          <View style={styles.statusModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.statusModalTitle}>Update Status</Text>
            {statusUpdateRequestId && (() => {
              const request = requests.find(r => r.id === statusUpdateRequestId);
              const availableStatuses = request ? getAvailableStatuses(request.status) : [];
              return (
                <View style={styles.statusOptionsContainer}>
                  {availableStatuses.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={styles.statusOption}
                      onPress={() => handleUpdateStatus(statusUpdateRequestId, status)}
                    >
                      <Text style={styles.statusOptionText}>{getStatusLabel(status)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })()}
            <TouchableOpacity
              style={styles.statusModalCloseButton}
              onPress={() => {
                setShowStatusDropdown(false);
                setStatusUpdateRequestId(null);
              }}
            >
              <Text style={styles.statusModalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Message Notification Popup */}
      <Modal
        visible={newMessageNotification !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNewMessageNotification(null)}
      >
        <TouchableOpacity
          style={styles.notificationOverlay}
          activeOpacity={1}
          onPress={() => setNewMessageNotification(null)}
        >
          <View style={styles.notificationContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.notificationTitle}>💬 New Message</Text>
            {newMessageNotification && (
              <>
                <Text style={styles.notificationSender}>
                  From: {newMessageNotification.senderName}
                </Text>
                <Text style={styles.notificationMessage} numberOfLines={3}>
                  {newMessageNotification.message}
                </Text>
                <View style={styles.notificationButtons}>
                  <TouchableOpacity
                    style={[styles.notificationButton, styles.notificationButtonClose]}
                    onPress={() => setNewMessageNotification(null)}
                  >
                    <Text style={styles.notificationButtonText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.notificationButton, styles.notificationButtonOpen]}
                    onPress={() => {
                      if (newMessageNotification) {
                        // Find the request to get the other person's name
                        const request = requests.find((r: HelpRequest) => r.id === newMessageNotification.requestId);
                        let otherName = newMessageNotification.senderName;
                        if (request) {
                          if (isVolunteerView) {
                            otherName = request.elder_name || 'Senior Citizen';
                          } else {
                            otherName = request.volunteer_name || 'Volunteer';
                          }
                        }
                        setChatRequestId(newMessageNotification.requestId);
                        setChatOtherUserName(otherName);
                        setShowChat(true);
                        setNewMessageNotification(null);
                      }
                    }}
                  >
                    <Text style={[styles.notificationButtonText, styles.notificationButtonOpenText]}>
                      Open Chat
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Chat Modal */}
      {showChat && chatRequestId && currentUserId && currentUserType && (
        <Chat
          visible={showChat}
          onClose={() => {
            setShowChat(false);
            setChatRequestId(null);
            setChatOtherUserName("");
          }}
          requestId={chatRequestId}
          currentUserId={currentUserId}
          currentUserType={currentUserType}
          otherUserName={chatOtherUserName}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
  },
  tableContainer: {
    flex: 1,
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#666',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#444',
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    width: '100%',
  },
  tableCell: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  idCell: {
    flex: 0,
    minWidth: 70,
    maxWidth: 80,
  },
  typeCell: {
    flex: 0,
    minWidth: 120,
    maxWidth: 150,
  },
  descriptionCell: {
    flex: 1,
    minWidth: 200,
  },
  priorityCell: {
    flex: 0,
    minWidth: 80,
    maxWidth: 100,
  },
  createdCell: {
    flex: 0,
    minWidth: 100,
    maxWidth: 120,
  },
  dueCell: {
    flex: 0,
    minWidth: 110,
    maxWidth: 130,
  },
  statusCell: {
    flex: 0,
    minWidth: 100,
    maxWidth: 120,
  },
  assignedCell: {
    flex: 0,
    minWidth: 120,
    maxWidth: 150,
  },
  actionCell: {
    flex: 0,
    minWidth: 100,
    maxWidth: 120,
  },
  assignedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  genderIcon: {
    fontSize: 16,
  },
  assignedName: {
    fontSize: 13,
    color: '#333',
    flexShrink: 1,
  },
  notAssignedText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  chatButton: {
    marginLeft: 6,
    padding: 4,
  },
  chatIcon: {
    fontSize: 18,
  },
  actionLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  editLink: {
    color: '#2196F3',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  cancelLink: {
    color: '#F44336',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  inProgressLink: {
    color: '#FF9800',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  completeLink: {
    color: '#4CAF50',
    fontSize: 13,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  releaseLink: {
    color: '#F44336',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  updateStatusLink: {
    color: '#2196F3',
    fontSize: 13,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  linkSeparator: {
    color: '#999',
    fontSize: 13,
    marginHorizontal: 4,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  cellText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelledText: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 12,
    fontStyle: 'italic',
  },
  acceptLink: {
    color: '#4CAF50',
    fontSize: 13,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  assignedText: {
    color: '#2196F3',
    fontSize: 12,
    fontStyle: 'italic',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  priorityOption: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
  },
  priorityOptionSelected: {
    // Colors are set inline
  },
  priorityOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  priorityOptionTextSelected: {
    fontWeight: 'bold',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownContainer: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: -15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  newTypeContainer: {
    marginTop: -15,
    marginBottom: 15,
  },
  newTypeButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  newTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelNewTypeButton: {
    backgroundColor: '#ccc',
  },
  addNewTypeButton: {
    backgroundColor: '#2196F3',
  },
  newTypeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  confirmModalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmModalButtonCancel: {
    backgroundColor: '#e0e0e0',
  },
  confirmModalButtonConfirm: {
    backgroundColor: '#F44336',
  },
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  confirmModalButtonTextConfirm: {
    color: '#fff',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    marginBottom: 15,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  singleLineInput: {
    minHeight: 50,
  },
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
    minHeight: 50,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  cancelModalButton: {
    backgroundColor: '#ccc',
  },
  saveModalButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  statusModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
  },
  statusModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  statusOptionsContainer: {
    width: '100%',
    marginBottom: 15,
  },
  statusOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statusModalCloseButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ccc',
    borderRadius: 8,
    marginTop: 10,
  },
  statusModalCloseButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  ratingModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 25,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  ratingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingStarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  starButton: {
    padding: 5,
  },
  starIcon: {
    fontSize: 40,
  },
  ratingModalButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 10,
  },
  ratingModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  ratingModalCancelButton: {
    backgroundColor: '#ccc',
  },
  ratingModalSubmitButton: {
    backgroundColor: '#4CAF50',
  },
  ratingModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingModalSubmitButtonText: {
    color: '#fff',
  },
  completedActionContainer: {
    alignItems: 'flex-start',
  },
  ratingDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratingStars: {
    fontSize: 14,
  },
  ratedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  rateLink: {
    color: '#FF9800',
    fontSize: 13,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  ratingCommentContainer: {
    position: 'relative',
  },
  ratingCommentPreview: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 5,
    maxWidth: 100,
    cursor: 'pointer',
  },
  tooltip: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 6,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#333',
  },
  ratingsSection: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  ratingsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  ratingsScrollView: {
    flexGrow: 0,
  },
  ratingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    minWidth: 200,
    maxWidth: 250,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingCardRequestId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  ratingCardStars: {
    fontSize: 14,
  },
  ratingCardElder: {
    fontSize: 12,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  ratingCardComment: {
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
    marginBottom: 6,
    lineHeight: 16,
  },
  ratingCardDate: {
    fontSize: 10,
    color: '#999',
  },
  distanceFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 10,
    flexWrap: 'wrap',
  },
  distanceFilterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  distanceFilterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    backgroundColor: '#fff',
    minWidth: 60,
    textAlign: 'center',
  },
  distanceFilterNote: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
    minWidth: '100%',
  },
  rewardModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  rewardModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  rewardModalSubtitle: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  rewardModalQuestion: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  rewardOptionsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  rewardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  rewardOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  rewardOptionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  rewardModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 10,
  },
  rewardModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  rewardModalCancelButton: {
    backgroundColor: '#ccc',
  },
  rewardModalConfirmButton: {
    backgroundColor: '#4CAF50',
  },
  rewardModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rewardModalConfirmButtonText: {
    color: '#fff',
  },
  rewardCell: {
    flex: 0,
    minWidth: 120,
    maxWidth: 150,
  },
  rewardColumnContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 5,
  },
  rewardAmount: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ratingInRewardColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  notificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  notificationSender: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  notificationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  notificationButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  notificationButtonClose: {
    backgroundColor: '#ccc',
  },
  notificationButtonOpen: {
    backgroundColor: '#4CAF50',
  },
  notificationButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButtonOpenText: {
    color: '#fff',
  },
});

export default RequestList;

