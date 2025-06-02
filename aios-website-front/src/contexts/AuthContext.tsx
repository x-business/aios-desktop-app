"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
// import GoogleAuthProvider from "firebase/auth";
// import signInWithPopup from "firebase/auth";
// import getAuth from "firebase/auth";
// import initializeApp from "firebase/app";

interface User {
  id: string;
  email: string;
  displayName: string;
  subscription?: {
    planId: string;
    planName: string;
    status: string;
    currentPeriodEnd: string;
  };
  createdAt: string;
  profilePicture?: string;
  pointsBalance?: number;
  activities?: ActivityItem[];
}

// Add ActivityItem interface for tracking user activities
interface ActivityItem {
  id: string;
  type:
    | "login"
    | "model_usage"
    | "mcp_usage"
    | "data_access"
    | "settings_change"
    | "system";
  description: string;
  timestamp: string;
  details?: string;
  model?: string;
  mcp?: string;
}

interface AuthOptions {
  isElectron?: boolean;
  redirectUri?: string;
  state?: string;
  clientId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUserData: () => Promise<void>;
  login: (
    email: string,
    password: string,
    options?: AuthOptions
  ) => Promise<{ success: boolean; message?: string; token?: string }>;
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (options?: AuthOptions) => Promise<{
    success: boolean;
    message?: string;
  }>;
  handleAuthCallback: (token: string) => Promise<boolean>;
  logout: () => void;
  addActivity: (activity: Omit<ActivityItem, "id" | "timestamp">) => void;
  getUserActivities: () => ActivityItem[];
  resetMockData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default user for demonstration
// const DEFAULT_USERS: User[] = [...];
// const DEFAULT_CREDENTIALS = [...];
// const getStoredMockData = () => {...};
// const saveMockData = () => {...};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const [, setMockUsers] = useState<User[]>(DEFAULT_USERS);
  // const [, setMockCredentials] = useState(DEFAULT_CREDENTIALS);
  const router = useRouter();

  // Initialize mock data from localStorage if available
  // useEffect(() => {
  //   const { users, credentials } = getStoredMockData();
  //   setMockUsers(users as User[]);
  //   setMockCredentials(
  //     credentials as { email: string; password: string; userId: string }[]
  //   );
  // }, []);

  useEffect(() => {
    // Check if user is logged in via local storage
    const storedUser = localStorage.getItem("aios_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Find user in our mock database to get latest data
        // const { users } = getStoredMockData();
        const updatedUser = parsedUser as User;

        if (updatedUser) {
          setUser(updatedUser);
        } else {
          setUser(parsedUser);
        }
      } catch (error) {
        console.log(error);
        // Invalid stored data, clear it
        localStorage.removeItem("aios_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
    options?: AuthOptions
  ): Promise<{ success: boolean; message?: string; token?: string }> => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            isElectron: options?.isElectron,
            clientId: options?.clientId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Failed to sign in",
        };
      }

      // Store the token
      localStorage.setItem("aios_token", data.token);

      // Transform backend user data to match our User interface
      const userProfile: User = {
        id: data.user.id,
        displayName: data.user.displayName,
        email: data.user.email,
        subscription: data.user.subscription
          ? {
              planId: data.user.subscription.planId,
              planName: data.user.subscription.planName,
              status: data.user.subscription.status,
              currentPeriodEnd: data.user.subscription.currentPeriodEnd,
            }
          : undefined,
        createdAt: new Date(data.user.createdAt).toISOString(),
        profilePicture: data.user.profilePicture,
        pointsBalance: data.user.pointsBalance || 0,
        activities: [
          {
            id: `act-${Date.now()}`,
            type: "login",
            description: "Signed in with email",
            timestamp: new Date().toISOString(),
            details: "Email login",
          },
        ],
      };

      // Update user state
      setUser(userProfile);
      localStorage.setItem("aios_user", JSON.stringify(userProfile));

      // If this is an Electron login, redirect back to the app
      if (options?.isElectron && options?.redirectUri) {
        // Include state if provided
        const redirectUrl = new URL(options.redirectUri);
        redirectUrl.searchParams.set("token", data.token);
        if (options.state) {
          redirectUrl.searchParams.set("state", options.state);
        }

        // Redirect back to Electron app
        window.location.href = redirectUrl.toString();
        return { success: true, token: data.token };
      }

      return { success: true, token: data.token };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "An unexpected error occurred. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Failed to create account",
        };
      }

      // Store the token and user data
      localStorage.setItem("aios_token", data.token);

      // Transform backend user data to match our User interface
      const userProfile: User = {
        id: data.user.id,
        displayName: data.user.displayName,
        email: data.user.email,
        subscription: data.user.subscription
          ? {
              planId: data.user.subscription.planId,
              planName: data.user.subscription.planName,
              status: data.user.subscription.status,
              currentPeriodEnd: data.user.subscription.currentPeriodEnd,
            }
          : undefined,
        createdAt: new Date(data.user.createdAt).toISOString(),
        profilePicture: data.user.profilePicture,
        pointsBalance: data.user.pointsBalance || 0,
        activities: [
          {
            id: `act-${Date.now()}`,
            type: "login",
            description: "Signed up with email",
            timestamp: new Date().toISOString(),
            details: "Email registration",
          },
        ],
      };

      // Update user state
      setUser(userProfile);

      // Store user in local storage
      localStorage.setItem("aios_user", JSON.stringify(userProfile));

      return { success: true };
    } catch (error) {
      console.error("Signup error:", error);
      return {
        success: false,
        message: "An unexpected error occurred. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("aios_user");
    localStorage.removeItem("aios_token"); // Clear the JWT token
    router.push("/");
  };

  const addActivity = (activity: Omit<ActivityItem, "id" | "timestamp">) => {
    if (!user) return;

    const newActivity: ActivityItem = {
      ...activity,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    const updatedUser = {
      ...user,
      activities: [...(user.activities || []), newActivity],
    };

    // Update user in state and localStorage
    setUser(updatedUser);
    localStorage.setItem("aios_user", JSON.stringify(updatedUser));

    // Update user in mock database
    // const { users, credentials } = getStoredMockData();
    // const updatedUsers = users.map((u: User) =>
    //   u.id === user.id ? updatedUser : u
    // );
    // saveMockData(updatedUsers, credentials);
  };

  const getUserActivities = () => {
    return user?.activities || [];
  };

  // Function to reset all mock data to defaults
  const resetMockData = () => {
    // Clear all localStorage data
    localStorage.clear();

    // Reset state
    setUser(null);
    // setMockUsers(DEFAULT_USERS);
    // setMockCredentials(DEFAULT_CREDENTIALS);

    // Save the defaults back to localStorage
    // saveMockData(DEFAULT_USERS, DEFAULT_CREDENTIALS);
  };

  // Add Google authentication function
  const loginWithGoogle = async (
    options?: AuthOptions
  ): Promise<{
    success: boolean;
    message?: string;
  }> => {
    setIsLoading(true);

    try {
      console.log("Google login options:", options);

      let authUrl = `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      }/api/auth/google`;

      // Encode all parameters in state
      const stateData = {
        isElectron: options?.isElectron || false,
        redirectUri: options?.redirectUri,
        clientId: options?.clientId,
      };

      console.log("State data to encode:", stateData);

      // Convert to base64
      const encodedState = Buffer.from(JSON.stringify(stateData)).toString(
        "base64"
      );

      // Add state parameter
      const params = new URLSearchParams();
      params.append("state", encodedState);

      // Append params if any exist
      authUrl += `?${params.toString()}`;
      console.log("Final auth URL:", authUrl);
      window.location.href = authUrl;

      return { success: true };
    } catch (error) {
      console.error("Google sign-in error:", error);
      setIsLoading(false);
      return {
        success: false,
        message: "Failed to sign in with Google. Please try again.",
      };
    }
  };

  const handleAuthCallback = async (token: string): Promise<boolean> => {
    try {
      // Get the URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const stateParam = urlParams.get("state");
      console.log("urlParams", urlParams);
      console.log("token", token);
      // Decode and parse the state parameter
      let stateData = {};
      if (stateParam) {
        try {
          const decodedState = Buffer.from(stateParam, "base64").toString();
          console.log("Decoded state string:", decodedState);
          stateData = JSON.parse(decodedState);
          console.log("Parsed state data:", stateData);
        } catch (error) {
          console.error("Failed to parse state parameter:", error);
        }
      }

      // Store the token
      localStorage.setItem("aios_token", token);

      // Fetch user data from backend
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();

      // Transform backend user data to match our User interface
      const userProfile: User = {
        id: data.user.id,
        displayName: data.user.displayName,
        email: data.user.email,
        subscription: data.user.subscription
          ? {
              planId: data.user.subscription.planId,
              planName: data.user.subscription.planName,
              status: data.user.subscription.status,
              currentPeriodEnd: data.user.subscription.currentPeriodEnd,
            }
          : undefined,
        createdAt: new Date(data.user.createdAt).toISOString(),
        profilePicture: data.user.profilePicture,
        pointsBalance: data.user.pointsBalance || 0,
        activities: [
          {
            id: `act-${Date.now()}`,
            type: "login",
            description: "Signed in with Google",
            timestamp: new Date().toISOString(),
            details: "Google authentication",
          },
        ],
      };

      setUser(userProfile);
      localStorage.setItem("aios_user", JSON.stringify(userProfile));

      // Handle Electron redirect if applicable
      // if (isElectron && redirectUri) {
      //   const electronRedirectUrl = new URL(redirectUri);
      //   electronRedirectUrl.searchParams.set("token", token);

      //   console.log(
      //     "Redirecting to Electron app:",
      //     electronRedirectUrl.toString()
      //   );
      //   window.location.href = electronRedirectUrl.toString();
      //   return true;
      // }

      // Regular web flow
      router.push("/dashboard");
      return true;
    } catch (error) {
      console.error("Auth callback error:", error);
      localStorage.removeItem("aios_token");
      localStorage.removeItem("aios_user");
      return false;
    }
  };

  // Add refreshUserData method
  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem("aios_token");
      if (!token) return;

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Refreshed user data:", data);
        setUser(data.user);
        localStorage.setItem("aios_user", JSON.stringify(data.user));
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        refreshUserData,
        login,
        signup,
        loginWithGoogle,
        handleAuthCallback,
        logout,
        addActivity,
        getUserActivities,
        resetMockData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext<AuthContextType | undefined>(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
