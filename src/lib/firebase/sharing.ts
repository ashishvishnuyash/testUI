import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';

export interface DashboardShare {
  id: string;
  dashboardId: string;
  ownerId: string;
  sharedWithUsers: string[]; // Array of user IDs
  permissions: {
    [userId: string]: 'view' | 'edit';
  };
  isPublic: boolean;
  publicToken?: string; // For public sharing
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SharedDashboardInfo {
  dashboardId: string;
  dashboardName: string;
  ownerEmail: string;
  permission: 'view' | 'edit';
  sharedAt: Timestamp;
}

// Helper function to check if Firebase is initialized
function checkFirebaseInitialization() {
  if (!db) {
    throw new Error('Firebase is not properly initialized. Please check your environment variables.');
  }
}

// Share a dashboard with specific users
export async function shareDashboard(
  dashboardId: string,
  ownerId: string,
  userEmails: string[],
  permission: 'view' | 'edit' = 'view'
): Promise<void> {
  try {
    checkFirebaseInitialization();
    
    // First, get user IDs from emails
    const userIds: string[] = [];
    const permissions: { [userId: string]: 'view' | 'edit' } = {};
    
    for (const email of userEmails) {
      // Query users collection to find user by email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email.toLowerCase())
      );
      const userSnapshot = await getDocs(usersQuery);
      
      if (!userSnapshot.empty) {
        const userId = userSnapshot.docs[0].id;
        userIds.push(userId);
        permissions[userId] = permission;
      } else {
        throw new Error(`User with email ${email} not found`);
      }
    }
    
    const shareId = `${dashboardId}_share`;
    const shareRef = doc(db, 'dashboard_shares', shareId);
    
    // Check if share document already exists
    const existingShare = await getDoc(shareRef);
    
    if (existingShare.exists()) {
      // Update existing share
      await updateDoc(shareRef, {
        sharedWithUsers: arrayUnion(...userIds),
        permissions: {
          ...existingShare.data().permissions,
          ...permissions
        },
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new share document
      await setDoc(shareRef, {
        id: shareId,
        dashboardId,
        ownerId,
        sharedWithUsers: userIds,
        permissions,
        isPublic: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    
  } catch (error) {
    console.error('Error sharing dashboard:', error);
    throw error;
  }
}

// Remove user access from a shared dashboard
export async function removeDashboardAccess(
  dashboardId: string,
  userEmail: string
): Promise<void> {
  try {
    checkFirebaseInitialization();
    
    // Get user ID from email
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', userEmail.toLowerCase())
    );
    const userSnapshot = await getDocs(usersQuery);
    
    if (userSnapshot.empty) {
      throw new Error(`User with email ${userEmail} not found`);
    }
    
    const userId = userSnapshot.docs[0].id;
    const shareId = `${dashboardId}_share`;
    const shareRef = doc(db, 'dashboard_shares', shareId);
    
    const shareDoc = await getDoc(shareRef);
    if (shareDoc.exists()) {
      const shareData = shareDoc.data();
      const updatedPermissions = { ...shareData.permissions };
      delete updatedPermissions[userId];
      
      await updateDoc(shareRef, {
        sharedWithUsers: arrayRemove(userId),
        permissions: updatedPermissions,
        updatedAt: serverTimestamp(),
      });
    }
    
  } catch (error) {
    console.error('Error removing dashboard access:', error);
    throw error;
  }
}

// Get dashboards shared with a user
export async function getSharedDashboards(userId: string): Promise<SharedDashboardInfo[]> {
  try {
    checkFirebaseInitialization();
    
    const sharesQuery = query(
      collection(db, 'dashboard_shares'),
      where('sharedWithUsers', 'array-contains', userId)
    );
    
    const sharesSnapshot = await getDocs(sharesQuery);
    const sharedDashboards: SharedDashboardInfo[] = [];
    
    for (const shareDoc of sharesSnapshot.docs) {
      const shareData = shareDoc.data() as DashboardShare;
      
      // Get dashboard info
      const dashboardRef = doc(db, 'dashboards', shareData.dashboardId);
      const dashboardDoc = await getDoc(dashboardRef);
      
      if (dashboardDoc.exists()) {
        const dashboardData = dashboardDoc.data();
        
        // Get owner info
        const ownerRef = doc(db, 'users', shareData.ownerId);
        const ownerDoc = await getDoc(ownerRef);
        const ownerEmail = ownerDoc.exists() ? ownerDoc.data().email : 'Unknown';
        
        sharedDashboards.push({
          dashboardId: shareData.dashboardId,
          dashboardName: dashboardData.name,
          ownerEmail,
          permission: shareData.permissions[userId] || 'view',
          sharedAt: shareData.createdAt,
        });
      }
    }
    
    return sharedDashboards;
    
  } catch (error) {
    console.error('Error getting shared dashboards:', error);
    throw error;
  }
}

// Check if user has access to a dashboard
export async function checkDashboardAccess(
  dashboardId: string,
  userId: string
): Promise<{ hasAccess: boolean; permission?: 'view' | 'edit'; isOwner?: boolean }> {
  try {
    checkFirebaseInitialization();
    
    // First check if user is the owner
    const dashboardRef = doc(db, 'dashboards', dashboardId);
    const dashboardDoc = await getDoc(dashboardRef);
    
    if (dashboardDoc.exists() && dashboardDoc.data().userId === userId) {
      return { hasAccess: true, permission: 'edit', isOwner: true };
    }
    
    // Check if dashboard is shared with user
    const shareId = `${dashboardId}_share`;
    const shareRef = doc(db, 'dashboard_shares', shareId);
    const shareDoc = await getDoc(shareRef);
    
    if (shareDoc.exists()) {
      const shareData = shareDoc.data() as DashboardShare;
      
      if (shareData.sharedWithUsers.includes(userId)) {
        return {
          hasAccess: true,
          permission: shareData.permissions[userId] || 'view',
          isOwner: false
        };
      }
    }
    
    return { hasAccess: false };
    
  } catch (error) {
    console.error('Error checking dashboard access:', error);
    return { hasAccess: false };
  }
}

// Get users who have access to a dashboard
export async function getDashboardShares(dashboardId: string): Promise<{
  users: Array<{ email: string; permission: 'view' | 'edit' }>;
  isPublic: boolean;
}> {
  try {
    checkFirebaseInitialization();
    
    const shareId = `${dashboardId}_share`;
    const shareRef = doc(db, 'dashboard_shares', shareId);
    const shareDoc = await getDoc(shareRef);
    
    if (!shareDoc.exists()) {
      return { users: [], isPublic: false };
    }
    
    const shareData = shareDoc.data() as DashboardShare;
    const users: Array<{ email: string; permission: 'view' | 'edit' }> = [];
    
    // Get user emails for each shared user ID
    for (const userId of shareData.sharedWithUsers) {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        users.push({
          email: userDoc.data().email,
          permission: shareData.permissions[userId] || 'view'
        });
      }
    }
    
    return {
      users,
      isPublic: shareData.isPublic || false
    };
    
  } catch (error) {
    console.error('Error getting dashboard shares:', error);
    return { users: [], isPublic: false };
  }
}

// Generate a public sharing token
export async function generatePublicShareToken(
  dashboardId: string,
  ownerId: string
): Promise<string> {
  try {
    checkFirebaseInitialization();
    
    const publicToken = `pub_${Math.random().toString(36).substr(2, 16)}`;
    const shareId = `${dashboardId}_share`;
    const shareRef = doc(db, 'dashboard_shares', shareId);
    
    const shareDoc = await getDoc(shareRef);
    
    if (shareDoc.exists()) {
      await updateDoc(shareRef, {
        isPublic: true,
        publicToken,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(shareRef, {
        id: shareId,
        dashboardId,
        ownerId,
        sharedWithUsers: [],
        permissions: {},
        isPublic: true,
        publicToken,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    
    return publicToken;
    
  } catch (error) {
    console.error('Error generating public share token:', error);
    throw error;
  }
}

// Revoke public access
export async function revokePublicAccess(dashboardId: string): Promise<void> {
  try {
    checkFirebaseInitialization();
    
    const shareId = `${dashboardId}_share`;
    const shareRef = doc(db, 'dashboard_shares', shareId);
    
    await updateDoc(shareRef, {
      isPublic: false,
      publicToken: null,
      updatedAt: serverTimestamp(),
    });
    
  } catch (error) {
    console.error('Error revoking public access:', error);
    throw error;
  }
}