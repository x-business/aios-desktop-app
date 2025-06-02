import { supabase } from '../config/database';
import { User, UserInsert } from '../models/User';

export const createUser = async (userData: UserInsert): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data;
}; 