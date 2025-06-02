import { Database } from '../types/supabase';
import { supabase } from '../config/database';

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

// User service functions to replace the Firebase converter
export const userService = {
  create: async (user: UserInsert) => {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: UserUpdate) => {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  findById: async (id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  findByGoogleId: async (googleId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('googleId', googleId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }
}; 