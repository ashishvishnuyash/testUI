import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import type { User } from 'firebase/auth';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}

// Helper function to check if Firebase is initialized
function checkFirebaseInitialization() {
  if (!db) {
    throw new Error('Firebase is not properly initialized. Please check your environment variables.');
  }
}

// Create or update user profile
export async function createOrUpdateUserProfile(user: User): Promise<void> {
  try {
    checkFirebaseInitialization();
    
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    const userData = {
      id: user.uid,
      email: user.email?.toLowerCase() || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    
    if (userDoc.exists()) {
      // Update existing user
      await updateDoc(userRef, userData);
    } else {
      // Create new user
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
      });
    }
    
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
}

// Get user profile by ID
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    checkFirebaseInitialization();
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    
    return null;
    
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

// Get user profile by email
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  try {
    checkFirebaseInitialization();
    
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email.toLowerCase())
    );
    
    const querySnapshot = await getDocs(usersQuery);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as UserProfile;
    }
    
    return null;
    
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

// Search users by email (for sharing functionality)
export async function searchUsersByEmail(emailQuery: string): Promise<UserProfile[]> {
  try {
    checkFirebaseInitialization();
    
    if (!emailQuery || emailQuery.length < 3) {
      return [];
    }
    
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '>=', emailQuery.toLowerCase()),
      where('email', '<=', emailQuery.toLowerCase() + '\uf8ff')
    );
    
    const querySnapshot = await getDocs(usersQuery);
    const users: UserProfile[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    
    return users.slice(0, 10); // Limit to 10 results
    
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}