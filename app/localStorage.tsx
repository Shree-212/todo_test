import SQLite from 'react-native-sqlite-storage';

// Open or create the database
const db = SQLite.openDatabase(
  { name: 'localData.db', location: 'default' },
  () => console.log('Database opened'),
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