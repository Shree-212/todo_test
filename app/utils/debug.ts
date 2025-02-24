import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export async function getDBPath() {
  const dbPath = `${FileSystem.documentDirectory}SQLite/todo.db`;
  console.log('Database path:', dbPath);
  
  if (Platform.OS === 'ios') {
    console.log('iOS DB path:', '~/Library/Developer/CoreSimulator/Devices/<device-id>/data/Containers/Data/Application/<app-id>/Documents/SQLite/todo.db');
  } else if (Platform.OS === 'android') {
    console.log('Android DB path:', '/data/data/com.your.app/files/SQLite/todo.db');
  }
  
  const { exists } = await FileSystem.getInfoAsync(dbPath);
  console.log('Database exists:', exists);
  
  return dbPath;
}
