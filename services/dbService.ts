
import { Case, ApiSource } from '../types';

const DB_NAME = 'PalestinianLawAdvisorDB';
// Bumping version to 3 forces a clean wipe of old/corrupted data
const DB_VERSION = 3; 
const CASES_STORE_NAME = 'cases';
const SETTINGS_STORE_NAME = 'settings';

interface Setting {
  key: string;
  value: any;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject('Database error: ' + request.error);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // CLEAN SLATE PROTOCOL:
      // Delete existing stores to prevent schema corruption or stale data
      if (db.objectStoreNames.contains(CASES_STORE_NAME)) {
          db.deleteObjectStore(CASES_STORE_NAME);
      }
      if (db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
          db.deleteObjectStore(SETTINGS_STORE_NAME);
      }

      // Re-create Stores with correct Schema
      const caseStore = db.createObjectStore(CASES_STORE_NAME, { keyPath: 'id' });
      caseStore.createIndex('createdAt', 'createdAt', { unique: false });
      caseStore.createIndex('title', 'title', { unique: false });
      caseStore.createIndex('caseType', 'caseType', { unique: false });

      const settingsStore = db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'key' });
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
  return dbPromise;
}

// Generic function to perform a transaction
async function performTransaction<T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = action(store);

    request.onsuccess = () => {
      resolve(request.result as T);
    };

    request.onerror = () => {
      console.error(`Transaction Error in ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

// Case operations
export const getAllCases = () => performTransaction<Case[]>(CASES_STORE_NAME, 'readonly', store => store.getAll());
export const getCase = (id: string) => performTransaction<Case>(CASES_STORE_NAME, 'readonly', store => store.get(id));
export const addCase = (caseItem: Case) => performTransaction(CASES_STORE_NAME, 'readwrite', store => store.add(caseItem));
export const updateCase = (caseItem: Case) => performTransaction(CASES_STORE_NAME, 'readwrite', store => store.put(caseItem));
export const deleteCase = (id: string) => performTransaction(CASES_STORE_NAME, 'readwrite', store => store.delete(id));
export const clearCases = () => performTransaction(CASES_STORE_NAME, 'readwrite', store => store.clear());

// Settings operations
export async function getSetting<T>(key: string): Promise<T | null> {
    try {
        const result = await performTransaction<Setting>(SETTINGS_STORE_NAME, 'readonly', store => store.get(key));
        return result ? result.value : null;
    } catch (e) {
        return null;
    }
}

export const setSetting = (setting: Setting) => performTransaction(SETTINGS_STORE_NAME, 'readwrite', store => store.put(setting));

// --- Token Usage Logic ---

interface TokenUsageData {
    date: string;
    count: number;
}

export const getTokenUsage = async (): Promise<number> => {
    try {
        const today = new Date().toDateString();
        const stored = await getSetting<TokenUsageData>('dailyTokenUsage');
        
        if (stored && stored.date === today) {
            return stored.count;
        }
        // If date changed or no data, reset to 0
        if (stored && stored.date !== today) {
             await setSetting({ key: 'dailyTokenUsage', value: { date: today, count: 0 } });
        }
        return 0;
    } catch (e) {
        return 0;
    }
};

export const incrementTokenUsage = async (amount: number) => {
    if (!amount || amount <= 0) return;
    try {
        const today = new Date().toDateString();
        const stored = await getSetting<TokenUsageData>('dailyTokenUsage');
        
        let newCount = amount;
        if (stored && stored.date === today) {
            newCount += stored.count;
        }

        await setSetting({ key: 'dailyTokenUsage', value: { date: today, count: newCount } });
        
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('tokensUpdated', { detail: newCount }));
    } catch (e) {
        console.error("Failed to increment token usage", e);
    }
};