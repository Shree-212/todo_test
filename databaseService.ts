import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import TodoList from '../models/TodoList';
import TodoCard from '../models/TodoCard';
import { DB_CONFIG } from '../config/database';

interface SQLiteError {
message: string;
}

interface SQLiteCallback {
(transaction: SQLite.SQLTransaction, error: SQLiteError): boolean;
}

interface SuccessCallback<T = void> {
(): T;
}

let db: SQLite.WebSQLDatabase | null = null;

export const initDatabase = async (): Promise<void> => {
if (db) return;

try {
    // Ensure SQLite directory exists
    const dbDir = `${FileSystem.documentDirectory}SQLite`;
    const { exists } = await FileSystem.getInfoAsync(dbDir);
    if (!Platform.OS.match(/web|test/) && !exists) {
    await FileSystem.makeDirectoryAsync(dbDir);
    }

    // Open database
    db = SQLite.openDatabase(DB_CONFIG.name);

    // Create tables
    await new Promise<void>((resolve, reject) => {
    db!.transaction(tx => {
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
            is_synced INTEGER DEFAULT 0
        );
        `);
        
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_lists_sync ON lists(is_synced);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_cards_sync ON cards(is_synced);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_cards_list ON cards(listId);');

        // Add database version tracking
        tx.executeSql(`
        CREATE TABLE IF NOT EXISTS db_version (
            version TEXT PRIMARY KEY,
            updated_at INTEGER NOT NULL
        );
        `);

        // Insert initial version if not exists
        tx.executeSql(
        'INSERT OR IGNORE INTO db_version (version, updated_at) VALUES (?, ?)',
        [DB_CONFIG.version, Date.now()]
        );
    }, 
    error => reject(new Error(`Database initialization failed: ${error.message}`)),
    () => resolve());
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
    (db as SQLite.WebSQLDatabase).transaction(
    (tx) => {
        tx.executeSql(
        'INSERT INTO lists (id, name, updated_at, is_synced) VALUES (?, ?, ?, ?)',
        [list.id, list.name, Date.now(), 0],
        () => resolve(),
        (_, error) => { reject(error); return false; }
        );
    },
    (error) => reject(error),
    () => resolve()
    );
});
};

// Remaining code follows the same pattern of fixes...

