import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export async function getStorageLocation() {
  if (Platform.OS === 'web') {
    console.log('\n=== Web Storage Location ===');
    console.log('1. Open Browser DevTools (F12)');
    console.log('2. Go to Application > Local Storage');
    console.log('3. Look for key: todoData');
    return null;
  }

  const filePath = `${FileSystem.documentDirectory}todoData.json`;
  console.log('\n=== File Storage Location ===');
  console.log('File path:', filePath);
  
  const { exists } = await FileSystem.getInfoAsync(filePath);
  console.log('File exists:', exists);
  
  return filePath;
}

export async function exportStorageData() {
  if (Platform.OS === 'web') {
    const data = localStorage.getItem('todoData');
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'todoData.json';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }
}
