import SQLite from 'react-native-sqlite-storage';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

// Determine database file path
let dbPath: string;

if (Platform.OS === 'android') {
  dbPath = `${RNFS.ExternalDirectoryPath}/localData.db`; // External storage (persists after uninstall)
} else if (Platform.OS === 'ios') {
  dbPath = `${RNFS.DocumentDirectoryPath}/localData.db`; // Documents directory (persists after uninstall)
} else if (Platform.OS === 'windows' || Platform.OS === 'macos') {
  dbPath = `${RNFS.DocumentDirectoryPath}/localData.db`; // Documents directory (persists after uninstall)
} else {
  dbPath = 'localData.db'; // Fallback for unknown platforms
}

// Open or create the database
const db = SQLite.openDatabase(
  { name: 'localData.db', location: 'default', createFromLocation: dbPath },
  () => console.log('Database opened at:', dbPath),
  (error) => console.error('Database open error:', error)
);

// Create table if not exists
db.transaction((tx) => {
  tx.executeSql(
    'CREATE TABLE IF NOT EXISTS localData (key TEXT PRIMARY KEY, value TEXT)',
    [],
    () => console.log('Table ready'),
    (error) => console.error('Table creation error:', error)
  );
});

// Save data
export async function saveLocalData(key: string, value: any) {
  if (!value) return;

  try {
    const jsonValue = JSON.stringify(value);
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT OR REPLACE INTO localData (key, value) VALUES (?, ?)',
        [key, jsonValue],
        () => console.log(`Data saved for key: ${key}`),
        (error) => console.error('Insert error:', error)
      );
    });
  } catch (e) {
    console.error('Error saving data:', e);
  }
}

// Get data
export async function getLocalData(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT value FROM localData WHERE key = ?',
        [key],
        (_, result) => {
          if (result.rows.length > 0) {
            resolve(JSON.parse(result.rows.item(0).value));
          } else {
            resolve(null);
          }
        },
        (error) => {
          console.error('Select error:', error);
          reject(error);
        }
      );
    });
  });
}