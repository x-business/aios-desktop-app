import { Request, Response, NextFunction } from "express";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabase } from "../config/database";
import { AuthRequest } from "../types/auth";
import { User } from "../models/User";
import logger from "../utils/logger";

// Generate JWT token
const generateToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, email: user.email },
    (process.env.JWT_SECRET as Secret) || "default_jwt_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" } as SignOptions
  );
};

// Google OAuth callback
export const googleAuthCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as User;
    const token = generateToken(user);

    const stateParam = req.query.state as string;

    // Decode state parameter
    let stateData = {};
    try {
      if (stateParam) {
        stateData = JSON.parse(Buffer.from(stateParam, "base64").toString());
        logger.debug("Decoded state data:", stateData);
      }
    } catch (error) {
      logger.error("Failed to parse state parameter:", error);
    }

    // Extract parameters from state
    const isElectron =
      stateData && "isElectron" in stateData
        ? (stateData as { isElectron: boolean }).isElectron
        : false;
    const redirectUri =
      stateData && "redirectUri" in stateData
        ? (stateData as { redirectUri: string }).redirectUri
        : undefined;

    // Handle Electron app callback
    if (isElectron && redirectUri) {
      const callbackUrl = new URL(redirectUri);
      callbackUrl.searchParams.set("token", token);
      callbackUrl.searchParams.set("user_id", user.id);
      callbackUrl.searchParams.set("email", user.email);
      callbackUrl.searchParams.set("state", stateParam); // Preserve original state

      logger.debug("Redirecting to Electron app:", callbackUrl.toString());
      res.redirect(callbackUrl.toString());
      return;
    }

    // Handle web app callback
    const webCallbackUrl = new URL(
      `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/callback`
    );
    webCallbackUrl.searchParams.set("token", token);
    if (stateParam) {
      webCallbackUrl.searchParams.set("state", stateParam);
    }

    res.redirect(webCallbackUrl.toString());
  } catch (error) {
    logger.error("Google auth callback error:", error);
    const errorRedirect = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/signin?error=auth_failed`;
    res.redirect(errorRedirect);
  }
};

// Get current user
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Fetch user data including active subscription (if exists)
    const { data: user, error } = await supabase
      .from("users")
      .select(
        `
        *,
        subscriptions!left (
          id,
          stripePlanId,
          status,
          currentPeriodEnd,
          stripeSubscriptionId,
          planName
        )
      `
      )
      .eq("id", req.user.id)
      .eq("subscriptions.status", "active")
      .single();

    if (error || !user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Format the subscription data
    const subscription = user.subscriptions?.[0];
    const formattedUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
      profilePicture: user.profilePicture,
      pointsBalance: user.pointsBalance,
      subscription: subscription
        ? {
            planId: subscription.stripePlanId,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            planName: subscription.planName,
          }
        : undefined,
    };

    res.status(200).json({ user: formattedUser });
  } catch (error) {
    next(error);
  }
};

// Add signup controller
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      res.status(400).json({ message: "Email already in use" });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = {
      displayName: name,
      email,
      password: hashedPassword,
      pointsBalance: 0,
      plan: "Free",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data: user, error } = await supabase
      .from("users")
      .insert(newUser)
      .select()
      .single();

    if (error || !user) {
      throw new Error("Failed to create user");
    }

    // Generate token
    const token = generateToken(user);

    // Return success with token
    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        pointsBalance: user.pointsBalance,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Signup error:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
};

// Add login controller
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.debug("Login attempt:", req.body);
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      logger.debug("Missing credentials");
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Check if user exists
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password || "");
    logger.debug("Password verification:", { isValid: isValidPassword });

    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate token
    const token = generateToken(user);

    // Return success with token
    const response = {
      message: "Logged in successfully",
      token,
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        pointsBalance: user.pointsBalance,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };

    logger.debug("Successful login response:", { userId: user.id });
    res.status(200).json(response);
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ message: "Failed to login" });
  }
};

// Logout
export const logout = (req: Request, res: Response): void => {
  // JWT is stateless, so we just tell the client to remove the token
  res.status(200).json({ message: "Logged out successfully" });
};
