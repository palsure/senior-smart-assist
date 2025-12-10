// Re-export types from api
export type {
  Elder,
  Volunteer,
  HelpRequest,
  Contribution,
  VolunteerContributions
} from '../services/api';

// Component-specific types
export interface SignInProps {
  onSignIn: (user: Elder | Volunteer, userType: 'elder' | 'volunteer') => void;
  onRegister: (userType: 'elder' | 'volunteer' | 'donor') => void;
}

export interface RequestFormProps {
  address: string;
  elder?: Elder;
  assigned?: any;
}

export interface CurrentUser {
  user: Elder | Volunteer;
  type: 'elder' | 'volunteer';
}

export type UserType = 'elder' | 'volunteer' | 'donor';
export type ElderTabType = 'SubmitRequest' | 'MyRequests' | 'Profile';
export type VolunteerTabType = 'AvailableRequests' | 'MyRequests' | 'Profile';
export type RegistrationType = 'elder' | 'volunteer';

