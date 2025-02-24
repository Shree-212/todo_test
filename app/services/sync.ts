import NetInfo from '@react-native-community/netinfo';
import * as storage from '../localStorage';
import axios from 'axios';
import { API_CONFIG, SYNC_CONFIG } from '../config/database';
import TodoList from '../models/TodoList';
import TodoCard from '../models/TodoCard';

// Define error types without direct import
type AxiosResponseType = {
  response?: unknown;
  message: string;
};

interface SyncResponse {
  success: boolean;
  error?: string;
}

interface UnsyncedData {
  lists: TodoList[];
  cards: TodoCard[];
}

class SyncManager {
  private static instance: SyncManager;
  private isOnline: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;
  private unsubscribeNetInfo: (() => void) | null = null;

  private constructor() {
    this.setupNetworkListener();
    this.startSyncInterval();
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  private setupNetworkListener(): void {
    this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOffline && this.isOnline) {
        this.syncNow().catch(this.handleSyncError);
      }
    });
  }

  private startSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncNow().catch(this.handleSyncError);
      }
    }, SYNC_CONFIG.interval);
  }

  private handleSyncError = (error: unknown): void => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync failed:', errorMessage);
    
    // Simplified network error detection
    if (error instanceof Error && 
        (errorMessage.includes('Network Error') || 
         errorMessage.includes('timeout') ||
         errorMessage.includes('connection refused'))) {
      this.isOnline = false;
    }
  };

  private async syncNow(): Promise<void> {
    if (this.isSyncing || !this.isOnline) return;

    let retryCount = 0;
    while (retryCount < SYNC_CONFIG.maxRetries && !this.isSyncing) {
      try {
        this.isSyncing = true;
        const unsynced = await storage.getUnsynced();
        
        if (unsynced.lists.length === 0 && unsynced.cards.length === 0) {
          return;
        }

        const response = await axios.post<SyncResponse>(
          `${API_CONFIG.url}${API_CONFIG.endpoints.sync}`,
          unsynced,
          { 
            timeout: API_CONFIG.timeout,
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        if (response.data.success) {
          await this.markItemsAsSynced(unsynced);
          break;
        }
      } catch (error) {
        retryCount++;
        this.handleSyncError(error);
        if (!this.isOnline) break;
        
        // Wait before retry with exponential backoff
        const delay = SYNC_CONFIG.backoffDelay * Math.pow(2, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      } finally {
        this.isSyncing = false;
      }
    }
  }

  private async markItemsAsSynced(unsynced: UnsyncedData): Promise<void> {
    const promises: Promise<void>[] = [
      ...unsynced.lists.map(list => storage.markAsSynced('list', list.id)),
      ...unsynced.cards.map(card => storage.markAsSynced('card', card.id))
    ];
    await Promise.all(promises);
  }

  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  }
}

export const syncManager = SyncManager.getInstance();
