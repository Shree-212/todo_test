import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import TodoList from '../models/TodoList';
import TodoCard from '../models/TodoCard';

// Fix SQLite types
type SQLiteDatabase = SQLite.WebSQLDatabase;
type SQLResultSet = SQLite.SQLResultSet;

let db: SQLiteDatabase | null = null;

// Initialize database
const initDB = async (): Promise<SQLiteDatabase> => {
  if (db) return db;

  const dbDir = `${FileSystem.documentDirectory}SQLite`;
  const dbPath = `${dbDir}/todo.db`;

  if (Platform.OS !== 'web') {
    const { exists } = await FileSystem.getInfoAsync(dbDir);
    if (!exists) {
      await FileSystem.makeDirectoryAsync(dbDir);
    }
  }

  return SQLite.openDatabase(Platform.OS === 'web' ? 'todo.db' : dbPath);
};

// Fix table creation
export const initDatabase = async (): Promise<void> => {
  try {
    db = await initDB();
    return new Promise((resolve, reject) => {
      db!.transaction(tx => {
        // Create tables
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS lists (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            updated_at INTEGER NOT NULL,
            is_synced INTEGER DEFAULT 0
          );
        `);

        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS cards (
            id TEXT PRIMARY KEY,
            text TEXT NOT NULL,
            listId TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            is_synced INTEGER DEFAULT 0,
            FOREIGN KEY (listId) REFERENCES lists (id) ON DELETE CASCADE
          );
        `);

        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS sync_queue (
            id TEXT PRIMARY KEY,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            action TEXT NOT NULL,
            data TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            retry_count INTEGER DEFAULT 0
          );
        `);
      }, reject, resolve);
    });
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// Fixed CRUD operations with proper error handling
export const createList = async (list: TodoList): Promise<void> => {
  if (!db) throw new Error('Database not initialized');
  if (!list?.id || !list?.name) throw new Error('Invalid list data');

  return new Promise((resolve, reject) => {
    db!.transaction(
      (tx) => {
        tx.executeSql(
          'INSERT INTO lists (id, name, updated_at, is_synced) VALUES (?, ?, ?, ?)',
          [list.id, list.name, Date.now(), 0],
          () => resolve(),
          (_, error) => { reject(error); return false; }
        );
      },
      (error) => reject(error)
    );
  });
};

// Fixed query operations with proper typing
export const getLists = async (): Promise<TodoList[]> => {
  if (!db) throw new Error('Database not initialized');

  return new Promise((resolve, reject) => {
    db!.transaction(
      (tx) => {
        tx.executeSql(
          'SELECT * FROM lists',
          [],
          (_, { rows: { _array } }) => resolve(_array as TodoList[]),
          (_, error) => { reject(error); return false; }
        );
      },
      (error) => reject(error)
    );
  });
};

// Add new sync-related methods
export const markAsSynced = async (entityType: 'list' | 'card', id: string): Promise<void> => {
  const table = entityType === 'list' ? 'lists' : 'cards';
  return new Promise((resolve, reject) => {
    db!.transaction(tx => {
      tx.executeSql(
        `UPDATE ${table} SET is_synced = 1 WHERE id = ?`,
        [id],
        (_, result) => resolve(),
        (_, error) => { reject(error); return false; }
      );
    });
  });
};

export const getUnsynced = async (): Promise<{lists: TodoList[], cards: TodoCard[]}> => {
  if (!db) throw new Error('Database not initialized');

  const lists = await new Promise<TodoList[]>((resolve, reject) => {
    db!.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM lists WHERE is_synced = 0',
        [],
        (_, { rows: { _array } }) => resolve(_array as TodoList[]),
        (_, error) => { reject(error); return false; }
      );
    });
  });

  const cards = await new Promise<TodoCard[]>((resolve, reject) => {
    db!.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM cards WHERE is_synced = 0',
        [],
        (_, { rows: { _array } }) => {
          resolve(_array.map(card => ({
            ...card,
            completed: Boolean(card.completed),
            createdAt: new Date(Number(card.createdAt)),
            updatedAt: new Date(Number(card.updatedAt))
          })));
        },
        (_, error) => { reject(error); return false; }
      );
    });
  });

  return { lists, cards };
};

export const createCard = async (card: TodoCard): Promise<void> => {
  if (!db) throw new Error('Database not initialized');
  
  return new Promise((resolve, reject) => {
    db!.transaction(tx => {
      tx.executeSql(
        'INSERT INTO cards (id, text, listId, completed, createdAt, updatedAt, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          card.id,
          card.text,
          card.listId,
          card.completed ? 1 : 0,
          card.createdAt.getTime(),
          card.updatedAt.getTime(),
          card.is_synced || 0
        ],
        () => resolve(),
        (_, error) => { reject(error); return false; }
      );
    });
  });
};

export const updateCard = async (card: TodoCard): Promise<void> => {
  if (!db) throw new Error('Database not initialized');
  
  return new Promise((resolve, reject) => {
    db!.transaction(tx => {
      tx.executeSql(
        'UPDATE cards SET text = ?, completed = ?, updatedAt = ?, is_synced = ? WHERE id = ?',
        [
          card.text,
          card.completed ? 1 : 0,
          card.updatedAt.getTime(),
          card.is_synced || 0,
          card.id
        ],
        () => resolve(),
        (_, error) => { reject(error); return false; }
      );
    });
  });
};

export const deleteCard = async (id: string): Promise<void> => {
  if (!db) throw new Error('Database not initialized');
  
  return new Promise((resolve, reject) => {
    db!.transaction(tx => {
      tx.executeSql(
        'DELETE FROM cards WHERE id = ?',
        [id],
        () => resolve(),
        (_, error) => { reject(error); return false; }
      );
    });
  });
};
