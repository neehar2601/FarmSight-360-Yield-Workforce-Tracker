import { User, LoginCredentials, RegisterData, AuthState } from '@/models';

// Mock user data
const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'john.farmer@example.com',
    name: 'John Farmer',
    role: 'owner',
    farmId: 'farm-1',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    phone: '+1-555-0123',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date('2024-09-10T08:30:00'),
  },
  {
    id: 'user-2',
    email: 'sarah.manager@example.com',
    name: 'Sarah Manager',
    role: 'manager',
    farmId: 'farm-1',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    phone: '+1-555-0124',
    isActive: true,
    createdAt: new Date('2024-02-01'),
    lastLogin: new Date('2024-09-09T16:45:00'),
  },
];

class AuthService {
  private currentUser: User | null = null;
  private isAuthenticated: boolean = false;

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = mockUsers.find(u => u.email === credentials.email);
    
    if (!user || credentials.password !== 'demo123') {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    this.currentUser = user;
    this.isAuthenticated = true;

    // Mock JWT token
    const token = `mock-jwt-token-${Date.now()}`;
    
    // Store in localStorage (in real app, use secure storage)
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { user, token };
  }

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name,
      role: 'owner',
      farmId: `farm-${Date.now()}`,
      phone: data.phone,
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    mockUsers.push(newUser);
    this.currentUser = newUser;
    this.isAuthenticated = true;

    const token = `mock-jwt-token-${Date.now()}`;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(newUser));

    return { user: newUser, token };
  }

  async logout(): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    this.currentUser = null;
    this.isAuthenticated = false;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<User | null> {
    // Check localStorage for existing session
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.currentUser = user;
        this.isAuthenticated = true;
        return user;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.logout();
      }
    }

    return null;
  }

  async resetPassword(email: string): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error('No user found with this email address');
    }

    // In real app, this would send a reset email
    console.log(`Password reset email sent to ${email}`);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    // In real app, verify current password against backend
    if (currentPassword !== 'demo123') {
      throw new Error('Current password is incorrect');
    }

    // In real app, hash and store new password
    console.log('Password changed successfully');
  }

  getAuthState(): AuthState {
    return {
      user: this.currentUser,
      isAuthenticated: this.isAuthenticated,
      isLoading: false,
      error: null,
    };
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated && this.currentUser !== null;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  hasRole(requiredRole: string): boolean {
    if (!this.currentUser) return false;
    
    const roleHierarchy = {
      'viewer': 1,
      'worker': 2,
      'manager': 3,
      'admin': 4,
      'owner': 5,
    };

    const userLevel = roleHierarchy[this.currentUser.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  }
}

// Export singleton instance
export const authService = new AuthService();
