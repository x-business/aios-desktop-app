import { db } from '../config/firebase';

describe('Firebase Connection', () => {
  test('Can connect to Firestore', async () => {
    try {
      const testDoc = await db.collection('test').doc('test').get();
      expect(testDoc).toBeDefined();
      console.log('Successfully connected to Firestore');
    } catch (error) {
      console.error('Failed to connect to Firestore:', error);
      throw error;
    }
  });
}); 