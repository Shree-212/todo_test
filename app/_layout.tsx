// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// import { useFonts } from 'expo-font';
// import { Stack } from 'expo-router';
// import * as SplashScreen from 'expo-splash-screen';
// import { StatusBar } from 'expo-status-bar';
// import { useEffect } from 'react';
// import 'react-native-reanimated';

// import { useColorScheme } from '@/hooks/useColorScheme';

// // Prevent the splash screen from auto-hiding before asset loading is complete.
// SplashScreen.preventAutoHideAsync();

// export default function RootLayout() {
//   const colorScheme = useColorScheme();
//   const [loaded] = useFonts({
//     SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
//   });

//   useEffect(() => {
//     if (loaded) {
//       SplashScreen.hideAsync();
//     }
//   }, [loaded]);

//   if (!loaded) {
//     return null;
//   }

//   return (
//     // <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//     //   <Stack>
//     //     <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//     //     <Stack.Screen name="+not-found" />
//     //   </Stack>
//     //   <StatusBar style="auto" />
//     // </ThemeProvider>
//     <div>Welcome to react native Saurabh</div>
//   );
// }




import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const App = () => {
  // Categories stored as objects: { id, name }
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // State for editing a category
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Tasks state: each task is an object { id, categoryId, text }
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState('');

  // Add a new category
  // const addCategory = () => {
  //   if (newCategory.trim()) {
  //     // Check for duplicates by name
  //     if (!categories.find(cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase())) {
  //       const newCat = { id: Date.now().toString(), name: newCategory.trim() };
  //       const updatedCategories = [...categories, newCat];
  //       setCategories(updatedCategories);
  //       setSelectedCategoryId(newCat.id);
  //     }
  //     setNewCategory('');
  //   }
  // };

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    // Check for duplicates in a case-insensitive manner
    if (categories.some(cat => cat.name.toLowerCase() === trimmed.toLowerCase())) {
      setNewCategory('');
      return;
    }
    const newCat = { id: Date.now().toString(), name: trimmed };
    setCategories(prev => [...prev, newCat]);
    setSelectedCategoryId(newCat.id);
    setNewCategory('');
  };
  

  // Delete a category (and its associated tasks)
  // const deleteCategory = (id) => {
  //   setCategories(categories.filter(cat => cat.id !== id));
  //   setTasks(tasks.filter(task => task.categoryId !== id));
  //   if (selectedCategoryId === id) {
  //     setSelectedCategoryId(null);
  //   }
  // };

  // Updated deleteCategory function:
const deleteCategory = (id) => {
  const updatedCategories = categories.filter(cat => cat.id !== id);
  setCategories(updatedCategories);
  // Remove tasks associated with the deleted category
  setTasks(tasks.filter(task => task.categoryId !== id));
  // If the deleted category was currently selected, update selection:
  if (selectedCategoryId === id) {
    if (updatedCategories.length > 0) {
      // Automatically select the first available category
      setSelectedCategoryId(updatedCategories[0].id);
    } else {
      setSelectedCategoryId(null);
    }
  }
};


  // Start editing a category
  const startEditingCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.name);
  };

  // Save edited category
  const saveCategory = (id) => {
    setCategories(categories.map(cat => cat.id === id ? { ...cat, name: editingCategoryName } : cat));
    // If currently selected category is edited, update selected name if needed (we store only id, so no need)
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  // Cancel editing a category
  const cancelEditingCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  // Add a new task under the selected category
  const addTask = () => {
    if (selectedCategoryId && taskText.trim()) {
      const newTask = {
        id: Date.now().toString(),
        categoryId: selectedCategoryId,
        text: taskText,
        completed: false,
        createdAt: new Date().toLocaleString(),
      };
      setTasks([...tasks, newTask]);
      setTaskText('');
    }
  };

  const toggleTaskStatus = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  // Delete a task
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Start editing a task
  const startEditingTask = (task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  };

  // For editing tasks
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Save edited task
  const saveTask = (id) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, text: editingText } : task));
    setEditingTaskId(null);
    setEditingText('');
  };

  // Render a single task item with edit and delete options
  const renderTaskItem = ({ item }) => (
    <View style={styles.taskItem}>
      {editingTaskId === item.id ? (
        <>
          <TextInput 
            style={styles.taskInput}
            value={editingText}
            onChangeText={setEditingText}
          />
          <Button title="Save" onPress={() => saveTask(item.id)} />
        </>
      ) : (
        <>
          <Text style={[styles.taskText, item.completed && { textDecorationLine: 'line-through' }]}>
          {item.text}
        </Text>
        {/* Toggle button for marking as done/not done */}
        <Text style={styles.timestamp}>Created at: {item.createdAt}</Text>
        <Button 
          title={item.completed ? "Not Done" : "Done"}
          onPress={() => toggleTaskStatus(item.id)}
        />
          {/* <Text style={styles.taskText}>{item.text}</Text> */}
          <Button title="Edit" onPress={() => startEditingTask(item)} />
          <Button title="Delete" onPress={() => deleteTask(item.id)} />
        </>
      )}
    </View>
  );

  // Render a category item with Edit and Delete functionality
  const renderCategory = (cat) => (
    <View key={cat.id} style={styles.categoryWrapper}>
      {editingCategoryId === cat.id ? (
        <>
          <TextInput 
            style={styles.categoryInput}
            value={editingCategoryName}
            onChangeText={setEditingCategoryName}
          />
          <Button title="Save" onPress={() => saveCategory(cat.id)} />
          <Button title="Cancel" onPress={cancelEditingCategory} color="gray" />
        </>
      ) : (
        <>
          {/* <TouchableOpacity 
            style={[
              styles.categoryButton,
              selectedCategoryId === cat.id && styles.selectedCategory
            ]}
            onPress={() => setSelectedCategoryId(cat.id)}
          >
            <Text style={styles.categoryText}>{cat.name}</Text>
          </TouchableOpacity>
          <Button title="Edit" onPress={() => startEditingCategory(cat)} />
          <Button title="X" onPress={() => deleteCategory(cat.id)} color="red" /> */}

{/* {categories.map(cat => ( */}
  <View
    key={cat.id}
    style={{
      position: 'relative',
      margin: 5,
      padding: 10,
      paddingBottom: 30, // Added extra padding at the bottom
      backgroundColor: '#ddd',
      borderRadius: 5,
    }}
  >
    
    <Text style={{ fontSize: 16 }} onPress={() => setSelectedCategoryId(cat.id)}>{cat.name}</Text>
    <View
      style={{
        position: 'absolute',
        right: 5,
        bottom: 5,
        flexDirection: 'row',
      }}
    >
      <TouchableOpacity onPress={() => startEditingCategory(cat)}>
        <Text style={{ fontSize: 14, marginRight: 10 }}>✎</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteCategory(cat.id)}>
        <Text style={{ fontSize: 14, color: 'red' }}>✖</Text>
      </TouchableOpacity>
    </View>
  </View>
{/* ))} */}

        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Time Stamp</Text>
      <Text style={styles.title}>Dynamic Todo List App</Text>

      {/* Section to add a new category */}
      <View style={styles.categoryInputContainer}>
        <TextInput 
          style={styles.input}
          placeholder="Enter new task type"
          value={newCategory}
          onChangeText={setNewCategory}
        />
        <Button title="Add Category" onPress={addCategory} />
      </View>

      {/* Display list of categories */}
      <View style={styles.categoryContainer}>
        {categories.map(renderCategory)}
      </View>

      {/* Section for adding a new task under the selected category */}
      {selectedCategoryId && (
        <View style={styles.inputContainer}>
          <Text style={styles.selectedCategoryTitle}>
            Tasks for "{categories.find(cat => cat.id === selectedCategoryId)?.name}"
          </Text>
          <TextInput 
            style={styles.input}
            placeholder="Add a new task"
            value={taskText}
            onChangeText={setTaskText}
          />
          <Button title="Add Task" onPress={addTask} />
        </View>
      )}

      {/* List tasks for the selected category */}
      {selectedCategoryId && (
        <FlatList 
          data={tasks.filter(task => task.categoryId === selectedCategoryId)}
          keyExtractor={item => item.id}
          renderItem={renderTaskItem}
          style={{ marginTop: 20 }}
        />
      )}
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: height * 0.05,    // 5% of screen height
    paddingRight: width * 0.15,   // 13% of screen width
    paddingBottom: height * 0.05, // 13% of screen height
    paddingLeft: width * 0.15,    // 5% of screen width
    marginTop: 50,
  },  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  categoryInputContainer: { flexDirection: 'row', marginBottom: 20 },
  // input: { flex: 1, borderColor: '#ccc', borderWidth: 1, marginRight: 10, paddingHorizontal: 10 },
  input: { 
    width: '100%',   // Increase this percentage to your desired width
    borderColor: '#ccc', 
    height: 34,
    borderWidth: 1, 
    marginRight: 10, 
    paddingHorizontal: 10 
  },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  categoryWrapper: { flexDirection: 'row', alignItems: 'center', margin: 5 },
  categoryButton: { padding: 10, backgroundColor: '#ddd', borderRadius: 5 },
  selectedCategory: { backgroundColor: '#bbb' },
  categoryText: { fontSize: 16 },
  categoryInput: { flex: 1, borderColor: '#ccc', borderWidth: 1, paddingHorizontal: 10 },
  selectedCategoryTitle: { fontSize: 18, marginBottom: 10, textAlign: 'center' },
  inputContainer: { marginBottom: 20 },
  taskItem: { padding: 10, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center' },
  taskText: { flex: 1 },
  taskInput: { flex: 1, borderColor: '#ccc', borderWidth: 1, marginRight: 10, paddingHorizontal: 10 }
});

export default App;
