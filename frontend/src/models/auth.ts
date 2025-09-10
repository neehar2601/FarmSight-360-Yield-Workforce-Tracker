export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  farmId: string;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export type UserRole = 'owner' | 'admin' | 'manager' | 'worker' | 'viewer';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  farmName: string;
  phone?: string;
}
