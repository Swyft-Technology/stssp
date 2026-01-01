import { MenuItem, Order, Category, User, TenantConfig, Topping, UserRole } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { auth, db } from '../firebase';
// UPDATE IMPORTS: Added 'onAuthStateChanged'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
    collection, 
    getDocs, 
    getDoc, 
    setDoc,
    deleteDoc, 
    doc, 
    query, 
    orderBy, 
    limit, 
    writeBatch,
    where 
} from 'firebase/firestore';

// Storage Keys
const CACHE_KEYS = {
  MENU: 'swyft_cached_menu',
  CATEGORIES: 'swyft_cached_categories',
  TOPPINGS: 'swyft_cached_toppings',
  OFFLINE_ORDERS: 'swyft_offline_orders_queue',
  CONFIG: 'swyft_cached_config'
};

class DataService {
  private isOnline: boolean = true;
  private networkListeners: ((status: boolean) => void)[] = [];

  constructor() {
    this.isOnline = navigator.onLine;
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));
  }

  private handleNetworkChange(status: boolean) {
    this.isOnline = status;
    this.notifyNetworkChange(status);
  }

  public getNetworkStatus() {
    return this.isOnline;
  }

  public onNetworkChange(callback: (status: boolean) => void) {
    this.networkListeners.push(callback);
    return () => {
      this.networkListeners = this.networkListeners.filter(cb => cb !== callback);
    };
  }

  private notifyNetworkChange(status: boolean) {
    this.networkListeners.forEach(cb => cb(status));
  }

  // --- Helper: Sanitize Data for Firestore ---
  private sanitizeData(data: any): any {
    return JSON.parse(JSON.stringify(data, (key, value) => {
        return value === undefined ? null : value;
    }));
  }

  // --- Data Access Methods (Firestore + Cache) ---

  public async getMenu(): Promise<MenuItem[]> {
    try {
        if (!navigator.onLine) throw new Error('Offline');
        const querySnapshot = await getDocs(collection(db, 'menu'));
        const items = querySnapshot.docs.map(doc => doc.data() as MenuItem);
        
        // Cache success
        localStorage.setItem(CACHE_KEYS.MENU, JSON.stringify(items));
        return items;
    } catch (e) {
        console.warn("Using offline menu cache");
        const cached = localStorage.getItem(CACHE_KEYS.MENU);
        return cached ? JSON.parse(cached) : [];
    }
  }

  public async getCategories(): Promise<Category[]> {
    try {
        if (!navigator.onLine) throw new Error('Offline');
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const items = querySnapshot.docs.map(doc => doc.data() as Category);
        
        localStorage.setItem(CACHE_KEYS.CATEGORIES, JSON.stringify(items));
        return items;
    } catch (e) {
        const cached = localStorage.getItem(CACHE_KEYS.CATEGORIES);
        return cached ? JSON.parse(cached) : [];
    }
  }

  public async getToppings(): Promise<Topping[]> {
    try {
        if (!navigator.onLine) throw new Error('Offline');
        const querySnapshot = await getDocs(collection(db, 'toppings'));
        const items = querySnapshot.docs.map(doc => doc.data() as Topping);

        localStorage.setItem(CACHE_KEYS.TOPPINGS, JSON.stringify(items));
        return items;
    } catch (e) {
        const cached = localStorage.getItem(CACHE_KEYS.TOPPINGS);
        return cached ? JSON.parse(cached) : [];
    }
  }

  public async getConfig(): Promise<TenantConfig> {
    try {
        if (!navigator.onLine) throw new Error('Offline');
        const docRef = doc(db, 'config', 'main');
        const snapshot = await getDoc(docRef);
        
        let config = DEFAULT_CONFIG;
        if (snapshot.exists()) {
            config = snapshot.data() as TenantConfig;
        }
        localStorage.setItem(CACHE_KEYS.CONFIG, JSON.stringify(config));
        return config;
    } catch (e) {
        const cached = localStorage.getItem(CACHE_KEYS.CONFIG);
        return cached ? JSON.parse(cached) : DEFAULT_CONFIG;
    }
  }

  // --- Offline Order Queue Management ---

  public saveOrderOffline(order: Order): void {
      const currentQueue = this.getOfflineOrders();
      // Mark as pending sync
      const offlineOrder = { ...order, status: 'queued' }; 
      currentQueue.push(offlineOrder);
      localStorage.setItem(CACHE_KEYS.OFFLINE_ORDERS, JSON.stringify(currentQueue));
  }

  public getOfflineOrders(): Order[] {
      const str = localStorage.getItem(CACHE_KEYS.OFFLINE_ORDERS);
      return str ? JSON.parse(str) : [];
  }

  public clearOfflineQueue(): void {
      localStorage.removeItem(CACHE_KEYS.OFFLINE_ORDERS);
  }

  // --- Write Methods ---

  public async saveMenu(menu: MenuItem[]) {
    const batch = writeBatch(db);
    menu.forEach(item => {
        const ref = doc(db, 'menu', item.id);
        batch.set(ref, this.sanitizeData(item));
    });
    await batch.commit();
  }

  public async deleteMenuItem(id: string) {
      await deleteDoc(doc(db, 'menu', id));
  }

  public async saveCategories(categories: Category[]) {
    const batch = writeBatch(db);
    categories.forEach(item => {
        const ref = doc(db, 'categories', item.id);
        batch.set(ref, this.sanitizeData(item));
    });
    await batch.commit();
  }

  public async deleteCategory(id: string) {
      await deleteDoc(doc(db, 'categories', id));
  }

  public async saveToppings(toppings: Topping[]) {
    const batch = writeBatch(db);
    toppings.forEach(item => {
        const ref = doc(db, 'toppings', item.id);
        batch.set(ref, this.sanitizeData(item));
    });
    await batch.commit();
  }

  public async deleteTopping(id: string) {
      await deleteDoc(doc(db, 'toppings', id));
  }

  public async saveConfig(config: TenantConfig) {
    await setDoc(doc(db, 'config', 'main'), this.sanitizeData(config));
  }

  public async getOrders(): Promise<Order[]> {
    if (!navigator.onLine) return []; 
    const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'), limit(100));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Order);
  }

  public async getOrdersByDate(startDate: number, endDate: number): Promise<Order[]> {
    if (!navigator.onLine) return [];
    const q = query(
      collection(db, 'orders'), 
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Order);
  }

  public async submitOrder(order: Order): Promise<boolean> {
    try {
        await setDoc(doc(db, 'orders', order.id), this.sanitizeData(order));
        return true;
    } catch (e) {
        console.error("Order submit failed", e);
        return false; 
    }
  }

  // --- Auth Methods (Firebase Auth) ---

  // NEW METHOD: Listen for Persistent Auth State
  public onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is logged in! Fetch their role from Firestore
        try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                callback({
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    name: userData.name || 'Staff Member',
                    role: userData.role || UserRole.STAFF 
                });
            } else {
                // Fallback if DB record is missing but Auth exists
                callback({
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    name: firebaseUser.displayName || 'Staff Member',
                    role: UserRole.STAFF 
                });
            }
        } catch (e) {
            console.error("Error fetching user profile", e);
            callback(null);
        }
      } else {
        // User is logged out
        callback(null);
      }
    });
  }

  public async login(email: string, password: string): Promise<User | null> {
    try {
        if (!navigator.onLine) throw new Error("Cannot login while offline");

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            return {
                id: uid,
                email: userCredential.user.email || '',
                name: userData.name || 'Staff Member',
                role: userData.role || UserRole.STAFF 
            };
        } else {
            return {
                id: uid,
                email: userCredential.user.email || '',
                name: userCredential.user.displayName || 'New User',
                role: UserRole.STAFF 
            };
        }
    } catch (error) {
        console.error("Login Error:", error);
        throw error;
    }
  }

  public async logout() {
      await signOut(auth);
  }
}

export const dataService = new DataService();