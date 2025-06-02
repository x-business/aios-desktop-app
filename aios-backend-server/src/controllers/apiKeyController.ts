import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
import { supabase } from '../config/database';
import { encryptApiKey } from '../services/encryptionService';
import { Database } from '../types/supabase';

// Get all API keys for a user
export const getUserApiKeys = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: apiKeys, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("userId", req.user?.id || '');

    if (error) throw error;
    
    res.status(200).json({ apiKeys });
  } catch (error) {
    next(error);
  }
};

// Add a new API key
export const addApiKey = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { provider, key, name } = req.body;
    
    const encryptedKey = encryptApiKey(key);
    
    const newApiKey = {
      userId: req.user?.id,
      provider: provider as Database["public"]["Enums"]["api_keys_provider_enum"],
      encryptedKey: encryptedKey,
      name: name || `${provider} key`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .insert(newApiKey)
      .select()
      .single();

    if (error) throw error;
    
    res.status(201).json({
      id: apiKey.id,
      provider: apiKey.provider,
      name: apiKey.name,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt
    });
  } catch (error) {
    next(error);
  }
};

// Delete an API key
export const deleteApiKey = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { data: existingKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .eq('userId', req.user?.id || '')
      .single();

    if (fetchError || !existingKey) {
      res.status(404).json({ message: 'API key not found' });
      return;
    }
    
    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    
    res.status(200).json({ message: 'API key deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Update API key status
export const updateApiKeyStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const { data: existingKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .eq('userId', req.user?.id || '')
      .single();

    if (fetchError || !existingKey) {
      res.status(404).json({ message: 'API key not found' });
      return;
    }
    
    const { data: updatedApiKey, error: updateError } = await supabase
      .from('api_keys')
      .update({ 
        isActive, 
        updatedAt: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    
    res.status(200).json(updatedApiKey);
  } catch (error) {
    next(error);
  }
}; 