import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import TodoList from './models/TodoList';
import TodoCard from './models/TodoCard';

interface StorageData {
  lists: TodoList[];
  cards: TodoCard[];
  version: string;
  lastSync: number;
}

const defaultData: StorageData = {
  lists: [],
  cards: [],
  version: '1.0',
  lastSync: Date.now()
};

const fileUri = FileSystem.documentDirectory + 'todoData.json';

// Initialize storage
export async function initStorage(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (!localStorage.getItem('todoData')) {
        localStorage.setItem('todoData', JSON.stringify(defaultData));
      }
    } else {
      const fileExists = await FileSystem.getInfoAsync(fileUri);
      if (!fileExists.exists) {
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(defaultData));
      }
    }
  } catch (error) {
    console.error('Storage initialization failed:', error);
    throw error;
  }
}

// Get all data
async function getAllData(): Promise<StorageData> {
  try {
    if (Platform.OS === 'web') {
      const data = localStorage.getItem('todoData');
      return data ? JSON.parse(data) : defaultData;
    } else {
      const fileExists = await FileSystem.getInfoAsync(fileUri);
      if (!fileExists.exists) return defaultData;
      const content = await FileSystem.readAsStringAsync(fileUri);
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading data:', error);
    return defaultData;
  }
}

// Save all data
async function saveAllData(data: StorageData): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('todoData', JSON.stringify(data));
    } else {
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
}

// Lists operations
export async function getLists(): Promise<TodoList[]> {
  const data = await getAllData();
  return data.lists;
}

export async function createList(list: TodoList): Promise<void> {
  const data = await getAllData();
  data.lists.push({ ...list, is_synced: 0 });
  await saveAllData(data);
}

export async function updateList(list: TodoList): Promise<void> {
  const data = await getAllData();
  data.lists = data.lists.map(l => l.id === list.id ? { ...list, is_synced: 0 } : l);
  await saveAllData(data);
}

export async function deleteList(id: string): Promise<void> {
  const data = await getAllData();
  data.lists = data.lists.filter(l => l.id !== id);
  data.cards = data.cards.filter(c => c.listId !== id);
  await saveAllData(data);
}

// Cards operations
export async function getCards(): Promise<TodoCard[]> {
  const data = await getAllData();
  return data.cards.map(card => ({
    ...card,
    completed: Boolean(card.completed),
    createdAt: new Date(card.createdAt),
    updatedAt: new Date(card.updatedAt)
  }));
}

export async function createCard(card: TodoCard): Promise<void> {
  const data = await getAllData();
  data.cards.push({ ...card, is_synced: 0 });
  await saveAllData(data);
}

export async function updateCard(card: TodoCard): Promise<void> {
  const data = await getAllData();
  data.cards = data.cards.map(c => c.id === card.id ? { ...card, is_synced: 0 } : c);
  await saveAllData(data);
}

export async function deleteCard(id: string): Promise<void> {
  const data = await getAllData();
  data.cards = data.cards.filter(c => c.id !== id);
  await saveAllData(data);
}

// Sync operations
export async function getUnsynced(): Promise<{ lists: TodoList[], cards: TodoCard[] }> {
  const data = await getAllData();
  return {
    lists: data.lists.filter(l => !l.is_synced),
    cards: data.cards.filter(c => !c.is_synced).map(card => ({
      ...card,
      completed: Boolean(card.completed),
      createdAt: new Date(card.createdAt),
      updatedAt: new Date(card.updatedAt)
    }))
  };
}

export async function markAsSynced(entityType: 'list' | 'card', id: string): Promise<void> {
  const data = await getAllData();
  if (entityType === 'list') {
    data.lists = data.lists.map(l => l.id === id ? { ...l, is_synced: 1 } : l);
  } else {
    data.cards = data.cards.map(c => c.id === id ? { ...c, is_synced: 1 } : c);
  }
  await saveAllData(data);
}