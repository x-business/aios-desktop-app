import { db } from '../config/firebase';
import { collections } from '../config/database';

describe('Firestore Setup', () => {
  test('Can connect to Firestore', async () => {
    const snapshot = await db.collection('users').limit(1).get();
    expect(snapshot).toBeDefined();
  });

  test('Collections are accessible', async () => {
    const promises = Object.values(collections).map(async (collection) => {
      const snapshot = await collection.limit(1).get();
      return snapshot.size >= 0;
    });
    
    const results = await Promise.all(promises);
    expect(results.every(result => result)).toBe(true);
  });
}); 