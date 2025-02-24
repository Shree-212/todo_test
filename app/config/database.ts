import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Database configuration
export const DB_CONFIG = {
  name: 'todo.db',
  version: '1.0',
  size: 2 * 1024 * 1024, // 2MB
  path: Platform.OS === 'web' 
    ? 'todo.db'
    : `${FileSystem.documentDirectory}SQLite/todo.db`,
  createDirectory: async () => {
    if (Platform.OS !== 'web') {
      const dirPath = `${FileSystem.documentDirectory}SQLite`;
      const { exists } = await FileSystem.getInfoAsync(dirPath);
      if (!exists) {
        await FileSystem.makeDirectoryAsync(dirPath);
      }
    }
  }
};

// Server configuration with proper type
export const API_CONFIG = {
  url: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 5000,
  retryAttempts: 3,
  endpoints: {
    sync: '/sync',
    lists: '/todo-lists',
    cards: '/todo-cards'
  }
};

// Sync configuration
export const SYNC_CONFIG = {
  interval: 30000,
  maxRetries: 3,
  batchSize: 50,
  backoffDelay: 1000 // 1 second initial backoff
};
