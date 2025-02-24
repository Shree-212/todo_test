import NetInfo from '@react-native-community/netinfo';
import * as db from './database';
import axios from 'axios';
import { API_CONFIG, SYNC_CONFIG } from '../config/database';

interface SyncQueueItem {
  id: string;
  entityType: 'list' | 'card';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: string;
  createdAt: number;
  retryCount: number;
}

class SyncManager {
  private static instance: SyncManager;
  private isOnline: boolean = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing: boolean = false;

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
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOffline && this.isOnline) {
        this.syncNow().catch(console.error);
      }
    });
  }

  private startSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncNow().catch(error => {
          console.error('Sync failed:', error);
        });
      }
    }, SYNC_CONFIG.interval);
  }

  private async syncNow(): Promise<void> {
    if (this.isSyncing || !this.isOnline) return;

    try {
      this.isSyncing = true;
      const unsynced = await db.getUnsynced();
      
      if (unsynced.lists.length || unsynced.cards.length) {
        const response = await axios.post(
          `${API_CONFIG.url}/sync`,
          unsynced,
          { 
            timeout: API_CONFIG.timeout,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success) {
          await Promise.all([
            ...unsynced.lists.map(list => db.markAsSynced('list', list.id)),
            ...unsynced.cards.map(card => db.markAsSynced('card', card.id))
          ]);
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const syncManager = SyncManager.getInstance();
