import { supabase } from '../config/database';
import { TransactionType, OperationType, pointTransactionService } from '../models/PointTransaction';
import { userService } from '../models/User';

// Add points to user's account
export const addPointsToUser = async (
  userId: string,
  points: number,
  transactionType: TransactionType,
  description?: string,
  metadata?: Record<string, any>,
  stripePaymentId?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
  try {
    // Start a Supabase transaction
    const { data: { user, transaction }, error } = await supabase.rpc('add_points_to_user', {
      p_user_id: userId,
      p_points: points,
      p_transaction_type: transactionType,
      p_description: description,
      p_metadata: metadata,
      p_stripe_payment_id: stripePaymentId
    });

    if (error) throw error;

    return { 
      success: true, 
      newBalance: user.points_balance 
    };
  } catch (error) {
    console.error('Error adding points:', error);
    return { success: false, error: 'Failed to add points' };
  }
};

// Deduct points from user's account
export const deductPointsFromUser = async (
  userId: string,
  points: number,
  operationType: OperationType,
  description?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
  try {
    // Start a Supabase transaction
    const { data: { user, transaction }, error } = await supabase.rpc('deduct_points_from_user', {
      p_user_id: userId,
      p_points: points,
      p_operation_type: operationType,
      p_description: description,
      p_metadata: metadata
    });

    if (error) throw error;

    return { 
      success: true, 
      newBalance: user.points_balance 
    };
  } catch (error) {
    console.error('Error deducting points:', error);
    return { success: false, error: 'Failed to deduct points' };
  }
};

// Calculate points cost for a specific operation
export const calculatePointsCost = (
  operationType: OperationType,
  params: Record<string, any>
): number => {
  switch (operationType) {
    case OperationType.CHAT:
      // Calculate based on model and token count
      const { model, inputTokens, outputTokens } = params;
      
      if (model.includes('gpt-4')) {
        return Math.ceil((inputTokens * 0.01 + outputTokens * 0.03) / 1000 * 100);
      } else if (model.includes('gpt-3.5')) {
        return Math.ceil((inputTokens * 0.001 + outputTokens * 0.002) / 1000 * 100);
      } else if (model.includes('claude')) {
        return Math.ceil((inputTokens * 0.008 + outputTokens * 0.024) / 1000 * 100);
      } else {
        // Default cost
        return Math.ceil((inputTokens + outputTokens) / 1000);
      }
      
    case OperationType.IMAGE:
      // Simple fixed cost
      return 2;
      
    case OperationType.AUDIO:
      // Base cost + time-based component
      const { durationMinutes } = params;
      return 5 + Math.ceil(durationMinutes * 10);
      
    case OperationType.VIDEO:
      // Based on complexity
      const { complexity } = params;
      return complexity === 'simple' ? 2 : complexity === 'medium' ? 5 : 10;
      
    default:
      return 1; // Default minimum cost
  }
}; 