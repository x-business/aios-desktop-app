import { supabase } from '../config/database';

describe('Database Connection', () => {
  it('should connect to Supabase', async () => {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBeTruthy();
  });
}); 