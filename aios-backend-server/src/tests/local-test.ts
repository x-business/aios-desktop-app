import dotenv from 'dotenv';
import { db } from '../config/firebase';
import { collections } from '../config/database';

dotenv.config();

async function testConnection() {
  try {
    // Test Firebase connection
    console.log('Testing Firebase connection...');
    const testDoc = await db.collection('test').doc('test').get();
    console.log('Firebase connection successful!');

    // Test collections access
    console.log('\nTesting collections access...');
    for (const [name, collection] of Object.entries(collections)) {
      const docs = await collection.limit(1).get();
      console.log(`${name}: ${docs.empty ? 'Empty' : 'Has documents'}`);
    }

    // Test writing to Firebase
    console.log('\nTesting write operation...');
    const testRef = db.collection('test').doc('test-' + Date.now());
    await testRef.set({
      message: 'Test successful',
      timestamp: new Date()
    });
    console.log('Write operation successful!');

    // Clean up test document
    await testRef.delete();
    console.log('Test document cleaned up');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testConnection(); 