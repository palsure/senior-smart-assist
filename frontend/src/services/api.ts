import axios from "axios";

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

// Use localhost for web, 10.0.2.2 for Android emulator, or your machine's IP for physical device
const getBaseURL = () => {
  try {
    if (getPlatformOS() === 'web') {
      return "http://localhost:5000/api/seniorsmartassist";
    }
  } catch (e) {
    // Fall through to default
  }
  // For mobile, use your machine's IP address or 10.0.2.2 for Android emulator
  return "http://10.0.2.2:5000/api/seniorsmartassist"; // Change to your IP for physical device
};

// Lazy API creation to avoid module load time issues
let _API: ReturnType<typeof axios.create> | null = null;
const getAPI = (): ReturnType<typeof axios.create> => {
  if (!_API) {
    _API = axios.create({
      baseURL: getBaseURL()
    });
  }
  return _API;
};

// Health Check
export const healthCheck = () => getAPI().get('/health');

// Login
export const loginElder = (username: string) => getAPI().post<Elder>('/login/elder', { username });
export const loginVolunteer = (username: string) => getAPI().post<Volunteer>('/login/volunteer', { username });

export const API = new Proxy({} as ReturnType<typeof axios.create>, {
  get: (target, prop) => {
    const api = getAPI();
    return (api as any)[prop];
  }
}) as ReturnType<typeof axios.create>;

// Types
export interface Elder {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  age: number;
}

export interface Volunteer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  skills?: string;
  availability?: 'available' | 'busy' | 'unavailable';
}

export interface HelpRequest {
  id: number;
  elder_id: number;
  volunteer_id?: number;
  request_type: string;
  description?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  address?: string;
  priority?: string;
  timestamp: string;
  assigned_at?: string;
  completed_at?: string;
  volunteer_name?: string;
  volunteer_gender?: string;
  elder_name?: string;
  distance_miles?: number;
  rating?: number;
  rating_comment?: string;
}

export interface Contribution {
  id: number;
  contributor_name: string;
  contributor_email: string;
  amount: number;
  volunteer_id?: number;
  volunteer_name?: string;
  message?: string;
  timestamp: string;
}

export interface VolunteerContributions {
  volunteer_id: number;
  volunteer_name: string;
  total_contributions: number;
  contribution_count: number;
  contributions: Contribution[];
}

// Registration
export const registerElder = (data: {
  name: string;
  email: string;
  phone: string;
  address: string;
  age: number;
}) => API.post('/register/elder', data);

export const registerVolunteer = (data: {
  name: string;
  email: string;
  phone: string;
  address?: string;
  skills?: string;
  gender?: string;
  has_car?: boolean;
  availability?: 'available' | 'busy' | 'unavailable';
}) => API.post('/register/volunteer', data);

// Elders and Volunteers
export const getElders = () => API.get<Elder[]>('/elders');
export const getVolunteers = () => API.get<Volunteer[]>('/volunteers');

// Help Requests
export const getRequests = (volunteerId?: number) => {
  const url = volunteerId ? `/requests?volunteer_id=${volunteerId}` : '/requests';
  return API.get<HelpRequest[]>(url);
};
export const classifyRequest = (description: string) => 
  API.post<{ request_type: string; description: string }>('/classify-request', { description });

export const createRequest = (data: {
  type?: string;
  description?: string;
  address?: string;
  elder_id?: number;
}) => API.post('/request', data);

export const assignVolunteer = (requestId: number, volunteerId: number) =>
  API.post(`/request/${requestId}/assign`, { volunteer_id: volunteerId });

export const updateRequestStatus = (requestId: number, status: string, wantsReward?: boolean) =>
  API.put(`/request/${requestId}/status`, { status, wants_reward: wantsReward || false });

export const updateRequest = (requestId: number, data: {
  description?: string;
  address?: string;
  type?: string;
  priority?: string;
}) => API.put(`/request/${requestId}`, data);

export const rateVolunteer = (requestId: number, rating: number, comment?: string) =>
  API.post(`/request/${requestId}/rate`, { rating, rating_comment: comment || '' });

export interface VolunteerRating {
  request_id: number;
  request_type: string;
  description?: string;
  rating: number;
  rating_comment?: string;
  elder_name: string;
  completed_at?: string;
  timestamp?: string;
}

export interface VolunteerRatingsResponse {
  volunteer_id: number;
  volunteer_name: string;
  overall_rating: number | null;
  total_ratings: number;
  total_rewards: number;
  ratings: VolunteerRating[];
}

export const getVolunteerRatings = (volunteerId: number) =>
  API.get<VolunteerRatingsResponse>(`/volunteer/${volunteerId}/ratings`);

export const getElderRequests = (elderId: number) =>
  API.get<HelpRequest[]>(`/elder/${elderId}/requests`);

export const getVolunteerRequests = (volunteerId: number) =>
  API.get<HelpRequest[]>(`/volunteer/${volunteerId}/requests`);

// Contributions
export const addContribution = (data: {
  contributor_name: string;
  contributor_email: string;
  amount: number;
  volunteer_id?: number;
  message?: string;
}) => API.post('/contribution', data);

export const getContributions = () => API.get<Contribution[]>('/contributions');

export const getVolunteerContributions = (volunteerId: number) =>
  API.get<VolunteerContributions>(`/volunteer/${volunteerId}/contributions`);

// Chat API
export interface ChatMessage {
  id: number;
  request_id: number;
  sender_id: number;
  sender_type: 'elder' | 'volunteer';
  message: string;
  timestamp: string;
}

export const getChatMessages = (requestId: number) =>
  API.get<ChatMessage[]>(`/chat/${requestId}/messages`);

export const sendChatMessage = (requestId: number, senderId: number, senderType: 'elder' | 'volunteer', message: string) =>
  API.post<ChatMessage>(`/chat/${requestId}/send`, {
    sender_id: senderId,
    sender_type: senderType,
    message: message
  });
