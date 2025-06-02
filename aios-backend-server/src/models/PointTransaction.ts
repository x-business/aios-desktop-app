import { Database } from '../types/supabase';
import { supabase } from '../config/database';

export type PointTransaction = Database['public']['Tables']['point_transactions']['Row'];
export type PointTransactionInsert = Database['public']['Tables']['point_transactions']['Insert'];
export type PointTransactionUpdate = Database['public']['Tables']['point_transactions']['Update'];

export enum TransactionType {
  PURCHASE = 'PURCHASE',
  USAGE = 'DEBIT',
  REFUND = 'REFUND',
  BONUS = 'CREDIT'
}

export enum OperationType {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO'
}

export const pointTransactionService = {
  create: async (transaction: PointTransactionInsert) => {
    const { data, error } = await supabase
      .from('point_transactions')
      .insert(transaction)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  findByUserId: async (userId: string, page = 1, limit = 10) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('point_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    return {
      transactions: data,
      total: count || 0,
      page,
      limit,
      pages: count ? Math.ceil(count / limit) : 0
    };
  }
};