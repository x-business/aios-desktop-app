import jwt from "jsonwebtoken";
import { supabase } from "../config/database";
import { User } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

// Generate JWT token
export const generateToken = (user: User): string => {
  //   return jwt.sign(
  //     { id: user.id, email: user.email },
  //     JWT_SECRET,
  //     { expiresIn: JWT_EXPIRES_IN }
  //   );
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET as jwt.Secret);
};

// Verify JWT token
export const verifyToken = async (token: string): Promise<User | null> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();
      
    return error ? null : user;
  } catch (error) {
    return null;
  }
};
