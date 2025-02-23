import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const fileUri = FileSystem.documentDirectory + 'localData.json';

export async function saveLocalData(key: string, value: any) {
  if (!value){
    return
  }
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      let existingData: {[key: string]: any} = {};
      const fileExists = await FileSystem.getInfoAsync(fileUri);
      if (fileExists.exists) {
        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        existingData = JSON.parse(fileContent);
      }
      existingData[key] = value;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(existingData));
    }
  } catch (e) {
    console.error('Error saving data:', e);
  }
}

export async function getLocalData(key: string) {
  try {
    if (Platform.OS === 'web') {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } else {
      const fileExists = await FileSystem.getInfoAsync(fileUri);
      if (!fileExists.exists) return null;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const data = JSON.parse(fileContent);
      return data[key] || null;
    }
  } catch (e) {
    console.error('Error retrieving data:', e);
  }
}