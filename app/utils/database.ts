import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { DB_CONFIG } from '../config/database';

export async function getDatabasePath() {
  const dbName = DB_CONFIG.name;
  
  if (Platform.OS === 'ios') {
    return `${FileSystem.documentDirectory}SQLite/${dbName}`;
  } 
  
  if (Platform.OS === 'android') {
    return `${FileSystem.documentDirectory}SQLite/${dbName}`;
  }
  
  return dbName; // Web fallback
}

export async function ensureDatabaseDirectory() {
  if (Platform.OS === 'web') return;

  const dbDir = `${FileSystem.documentDirectory}SQLite`;
  const { exists } = await FileSystem.getInfoAsync(dbDir);
  
  if (!exists) {
    await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
  }
}

export async function backupDatabase() {
  const dbPath = await getDatabasePath();
  const backupPath = `${FileSystem.documentDirectory}backup_${DB_CONFIG.name}`;

  try {
    const { exists } = await FileSystem.getInfoAsync(dbPath);
    if (exists) {
      await FileSystem.copyAsync({
        from: dbPath,
        to: backupPath
      });
      console.log('Database backed up to:', backupPath);
    }
  } catch (error) {
    console.error('Database backup failed:', error);
  }
}

export function logDatabaseLocation() {
  if (!__DEV__) return;

  if (Platform.OS === 'ios') {
    console.log('\n=== Database Location (iOS) ===');
    console.log('1. Open Xcode');
    console.log('2. Window > Devices and Simulators');
    console.log('3. Select your device/simulator');
    console.log('4. Select your app');
    console.log('5. Download container');
    console.log('6. Navigate to AppData/Documents/SQLite/todo.db');
  }
  
  if (Platform.OS === 'android') {
    console.log('\n=== Database Location (Android) ===');
    console.log('1. Open Android Studio');
    console.log('2. View > Tool Windows > Device File Explorer');
    console.log('3. Navigate to:');
    console.log('   /data/data/your.app.package/files/SQLite/todo.db');
    console.log('\nOr use ADB:');
    console.log('adb pull /data/data/your.app.package/files/SQLite/todo.db ./todo.db');
  }
}
