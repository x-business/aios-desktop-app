export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  pointsBalance: number;
  createdAt: Date;
} 