export interface AuthState {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    username?: string;
  } | null;
  error?: string | null;
}

export interface TokenData {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface UserInfo {
  id: string;
  email: string;
  username?: string;
} 