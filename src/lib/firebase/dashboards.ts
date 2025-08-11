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
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface DashboardLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Widget {
  id: string;
  title: string;
  type: string;
  isMinimized?: boolean;
  isMaximized?: boolean;
  settings?: Record<string, any>;
}

export interface DashboardItem {
  id: string;
  name: string;
  type: 'dashboard' | 'folder';
  userId: string;
  parentId?: string | null;
  layout?: DashboardLayout[];
  widgets?: Widget[];
  children?: DashboardItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  order: number;
}

export interface DashboardData {
  id: string;
  name: string;
  type: 'dashboard' | 'folder';
  parentId?: string | null;
  layout?: DashboardLayout[];
  widgets?: Widget[];
  order: number;
}

// Helper function to check if Firebase is initialized
function checkFirebaseInitialization() {
  if (!db) {
    throw new Error('Firebase is not properly initialized. Please check your environment variables.');
  }
}

// Save a dashboard or folder
export async function saveDashboard(
  userId: string,
  dashboardData: DashboardData
): Promise<void> {
  try {
    checkFirebaseInitialization();
    
    const dashboardRef = doc(db, 'dashboards', dashboardData.id);
    
    await setDoc(dashboardRef, {
      ...dashboardData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
  } catch (error) {
    console.error('Error saving dashboard:', error);
    throw error;
  }
}

// Helper function to remove undefined values from an object
function removeUndefinedValues(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        cleaned[key] = value;
      } else if (value && typeof value === 'object' && value.constructor === Object) {
        const cleanedNested = removeUndefinedValues(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
}

// Update a dashboard or folder
export async function updateDashboard(
  dashboardId: string,
  updates: Partial<DashboardData>
): Promise<void> {
  try {
    checkFirebaseInitialization();
    
    const dashboardRef = doc(db, 'dashboards', dashboardId);
    
    // Remove undefined values to prevent Firebase errors
    const cleanedUpdates = removeUndefinedValues({
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    if (Object.keys(cleanedUpdates).length === 0) {
      console.warn('No valid updates to apply');
      return;
    }
    
    await updateDoc(dashboardRef, cleanedUpdates);
    
  } catch (error) {
    console.error('Error updating dashboard:', error);
    throw error;
  }
}

// Delete a dashboard or folder
export async function deleteDashboard(dashboardId: string): Promise<void> {
  try {
    checkFirebaseInitialization();
    
    const dashboardRef = doc(db, 'dashboards', dashboardId);
    await deleteDoc(dashboardRef);
    
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    throw error;
  }
}

// Get all dashboards for a user
export async function getUserDashboards(userId: string): Promise<DashboardItem[]> {
  try {
    checkFirebaseInitialization();
    
    const q = query(
      collection(db, 'dashboards'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const dashboards: DashboardItem[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      dashboards.push({
        id: doc.id,
        name: data.name,
        type: data.type,
        userId: data.userId,
        parentId: data.parentId || null,
        layout: data.layout || [],
        widgets: data.widgets || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        order: data.order || 0,
      });
    });
    
    // Sort by order and creation date
    dashboards.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.createdAt?.toMillis() - b.createdAt?.toMillis();
    });
    
    return dashboards;
    
  } catch (error) {
    console.error('Error getting user dashboards:', error);
    throw error;
  }
}

// Get a single dashboard
export async function getDashboard(dashboardId: string): Promise<DashboardItem | null> {
  try {
    checkFirebaseInitialization();
    
    const dashboardRef = doc(db, 'dashboards', dashboardId);
    const docSnap = await getDoc(dashboardRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        type: data.type,
        userId: data.userId,
        parentId: data.parentId || null,
        layout: data.layout || [],
        widgets: data.widgets || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        order: data.order || 0,
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Error getting dashboard:', error);
    throw error;
  }
}

// Organize flat dashboard list into hierarchical structure
export function organizeDashboards(dashboards: DashboardItem[]): DashboardItem[] {
  const dashboardMap = new Map<string, DashboardItem>();
  const rootDashboards: DashboardItem[] = [];
  
  // Create a map of all dashboards
  dashboards.forEach(dashboard => {
    dashboardMap.set(dashboard.id, { ...dashboard, children: [] });
  });
  
  // Organize into hierarchy
  dashboards.forEach(dashboard => {
    const dashboardWithChildren = dashboardMap.get(dashboard.id)!;
    
    if (dashboard.parentId && dashboardMap.has(dashboard.parentId)) {
      const parent = dashboardMap.get(dashboard.parentId)!;
      if (!parent.children) parent.children = [];
      parent.children.push(dashboardWithChildren);
    } else {
      rootDashboards.push(dashboardWithChildren);
    }
  });
  
  return rootDashboards;
}

// Batch save multiple dashboards (useful for reordering)
export async function batchSaveDashboards(
  userId: string,
  dashboards: DashboardData[]
): Promise<void> {
  try {
    checkFirebaseInitialization();
    
    const promises = dashboards.map(dashboard => 
      saveDashboard(userId, dashboard)
    );
    
    await Promise.all(promises);
    
  } catch (error) {
    console.error('Error batch saving dashboards:', error);
    throw error;
  }
}