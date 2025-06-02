import { supabase } from '../config/database';

export class BaseModel {
  protected static tableName: string;

  protected static async findOne(conditions: Record<string, any>) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .match(conditions)
      .single();

    if (error) throw error;
    return data;
  }

  protected static async findMany(conditions: Record<string, any>) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .match(conditions);

    if (error) throw error;
    return data;
  }
} 