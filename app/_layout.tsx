import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import TodoList from './models/TodoList';
import TodoCard from './models/TodoCard';
import TodoListAPI from './api/TodoListAPI';
import TodoCardAPI from './api/TodoCardAPI';
import NetInfo from "@react-native-community/netinfo";
import { SuccessResponse } from './api/API';
import { v4 } from 'uuid';
import LastSavedAPI from './api/LastSavedAPI';
import LastSaved from './models/LastSaved';

type APIResponse = SuccessResponse | TodoList[] | TodoCard[] | LastSaved;

function App() {
  const todoListAPI = new TodoListAPI();
  const todoCardAPI = new TodoCardAPI();
  const lastSavedAPI = new LastSavedAPI();
  const [offlineQueue, setOfflineQueue] = useState<(() => Promise<APIResponse | undefined>)[]>([]); // Queue for offline API calls
  const [isConnected, setIsConnected] = useState(true);
  
  const [lists, setLists] = useState<TodoList[]>([]);
  const [newListName, setNewListName] = useState<TodoList["name"]>('');
  const [editingListId, setEditingListId] = useState<TodoList["id"] | null>(null);
  const [editingListName, setEditingListName] = useState<TodoList["name"]>('');
  const [selectedListId, setSelectedListId] = useState<TodoList["id"] | null>(null);
  const [cards, setCards] = useState<TodoCard[]>([]);
  const [newCardText, setNewCardText] = useState<TodoCard["text"]>('');
  const [editingCardId, setEditingCardId] = useState<TodoCard["id"] | null>(null);
  const [editingCardText, setEditingCardText] = useState<TodoCard["text"]>('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  

  // If online, run the operation immediately, otherwise add it to the queue
  async function executeOperation(operation: () => Promise<APIResponse>, then?: (response: APIResponse) => void) {
    const apiCall = async () => {
      try {
        const response = await operation();
        if (("success" in response && !response.success) || (Array.isArray(response) && response.length === 0)) {
          throw response;
        }
        return response;
      } catch (error) {
        console.error("API call failed:", error);
      }
    }
    if (isConnected) {
      const response = await apiCall();
      if (then && response) {
        then(response);
      }
    }
    setOfflineQueue(prev => [...prev, apiCall]);
  }

  // Listen to network changes; process offline queue when reconnected
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      setIsConnected(state.isConnected || false);
      if (state.isConnected) {
        for (const apiCall of offlineQueue) {
          await apiCall(); // Execute each pending API call
        }
        setOfflineQueue([]); // Clear queue after processing
      }
    });
    return () => unsubscribe();
  }, []);

  // Select first list by default
  function selectFirstList() {
    if (lists.length > 0) {
      setSelectedListId(lists[0].id);
    } else {
      setSelectedListId(null);
    }
  }

  // Fetch lists
  useEffect(() => {
    executeOperation(
      todoListAPI.readTodoLists,
      (response) => {
        setLists(response as TodoList[])
        selectFirstList();
      }
    );
  }, []);

  // Fetch last saved timestamp
  useEffect(() => {
    executeOperation(
      lastSavedAPI.readLastSaved,
      (response) => {
        setLastSaved((response as LastSaved).timestamp);
      }
    );
  }, []);


  // Validate list name
  function listNameIsValid(name: string) {
    // TODO: Raise error toasts for invalid card text

    // Check if the list name is not empty and not already in the list
    return name && !lists.some(list => list.name.toLowerCase() === name.toLowerCase());
  }

  // Create a new to-do list
  function createList() {
    const name = newListName.trim();
    if (!listNameIsValid(name)) {
      return;
    }
    const newList = {
      id: v4(),
      name
    };
    setLists(prev => [...prev, newList]);
    setSelectedListId(newList.id);
    setNewListName('');
    executeOperation(() => todoListAPI.createTodoList(newList));
  }

  // Start editing a to-do list
  function startEditingList(list: TodoList) {
    setEditingListId(list.id);
    setEditingListName(list.name);
  }

  // Cancel editing a to-do list
  function cancelEditingList() {
    setEditingListId(null);
    setEditingListName('');
  }

  // Update a to-do list
  function updateList() {
    if (!(editingListId && editingListName)) {
      return;
    }
    const name = editingListName.trim();
    if (!listNameIsValid(name)) {
      return;
    }
    const updatedList = { id: editingListId, name };
    setLists(lists.map(list => list.id === editingListId ? updatedList : list));

    executeOperation(() => todoListAPI.updateTodoList(updatedList));

    cancelEditingList();
  }

  // Delete a to-do list
  function deleteList(id: TodoList["id"]) {
    setLists(lists.filter(list => list.id !== id));

    // Remove cards associated with the deleted list
    setCards(cards.filter(card => card.listId !== id));

    executeOperation(() => todoListAPI.deleteTodoList(id));

    // If the deleted list was currently selected, select the first list
    if (selectedListId === id) {
      selectFirstList();
    }
  }

  // Validate card text
  function cardIsValid(card: TodoCard) {
    // TODO: Raise error toasts for invalid card text
    return card.text && !cards.some(c => c.listId === card.listId && c.text.toLowerCase() === card.text.toLowerCase());
  }

  // Add a new to-do card in the selected list
  function createCard() {
    if (selectedListId) {
      const newCard = {
        id: v4(),
        text: newCardText.trim(),
        listId: selectedListId,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      if (!cardIsValid(newCard)) {
        return;
      }
      setCards(cards => [...cards, newCard]);
      setNewCardText('');
      executeOperation(() => todoCardAPI.createTodoCard(newCard));
    }
  }

  // Start editing a to-do card
  function startEditingCard(card: TodoCard) {
    setEditingCardId(card.id);
    setEditingCardText(card.text);
  }

  // Cancel editing a to-do card
  function cancelEditingCard() {
    setEditingCardId(null);
    setEditingCardText('');
  }

  // Update a to-do card
  function updateCard() {
    if (!(editingCardId && editingCardText)) {
      return;
    }
    const updatedCard = cards.find(card => card.id === editingCardId);
    if (!updatedCard) {
      return;
    }
    updatedCard.text = editingCardText;
    updatedCard.updatedAt = new Date();
    if (!cardIsValid(updatedCard)) {
      return;
    }
    setCards(cards.map(card => card.id === editingCardId ? updatedCard : card));
    executeOperation(() => todoCardAPI.updateTodoCard(updatedCard));
    cancelEditingCard();
  }

  // Delete a to-do card
  function deleteCard(id: TodoCard["id"]) {
    setCards(cards.filter(card => card.id !== id));
    executeOperation(() => todoCardAPI.deleteTodoCard(id));
  }

  // Toggle to-card completion status
  function toggleCardCompletion(id: TodoCard["id"]) {
    const selectedCard = cards.find(card => card.id === id);
    if (!selectedCard) {
      return;
    }
    const updatedCard = {
      ...selectedCard,
      completed: !selectedCard.completed,
      updatedAt: new Date()
    }
    setCards(cards.map(card => card.id === id ? updatedCard : card));
    executeOperation(() => todoCardAPI.updateTodoCard(updatedCard));
  }

  // Render a list item with Edit and Delete functionality
  function renderList(list: TodoList) {
    return (
      <View key={list.id} style={styles.listWrapper}>
        {editingListId === list.id ? (
          <>
            <TextInput
              style={styles.listInput}
              value={editingListName}
              onChangeText={setEditingListName}
            />
            <Button title="Save" onPress={() => updateList()} />
            <Button title="Cancel" onPress={cancelEditingList} color="gray" />
          </>
        ) : (
          <>
            <View
              key={list.id}
              style={{
                position: 'relative',
                margin: 5,
                padding: 10,
                paddingBottom: 30, // Added extra padding at the bottom
                backgroundColor: '#ddd',
                borderRadius: 5,
              }}
            >

              <Text style={{ fontSize: 16 }} onPress={() => setSelectedListId(list.id)}>{list.name}</Text>
              <View
                style={{
                  position: 'absolute',
                  right: 5,
                  bottom: 5,
                  flexDirection: 'row',
                }}
              >
                <TouchableOpacity onPress={() => startEditingList(list)}>
                  <Text style={{ fontSize: 14, marginRight: 10 }}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteList(list.id)}>
                  <Text style={{ fontSize: 14, color: 'red' }}>✖</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    );
  }

  // Render a single card item with edit and delete options
  function renderCard({ item }: { item: TodoCard }) {
    return (
      <View style={styles.cardItem}>
        {editingCardId === item.id ? (
          <>
            <TextInput
              style={styles.cardInput}
              value={editingCardText}
              onChangeText={setEditingCardText}
            />
            <Button title="Save" onPress={() => updateCard()} />
          </>
        ) : (
          <>
            <Text style={[styles.newCardText, item.completed && { textDecorationLine: 'line-through' }]}>
              {item.text}
            </Text>
            {/* Toggle button for marking as done/not done */}
            <Text>Created at: {item.createdAt.toLocaleDateString()}</Text>
            <Button
              title={item.completed ? "Not Done" : "Done"}
              onPress={() => toggleCardCompletion(item.id)}
            />
            {/* <Text style={styles.newCardText}>{item.text}</Text> */}
            <Button title="Edit" onPress={() => startEditingCard(item)} />
            <Button title="Delete" onPress={() => deleteCard(item.id)} />
          </>
        )}
      </View>
    );
  }

  // Format date
  function formatDate(date: Date) {
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    let formattedDate = timeFormatter.format(date);
    // Show the date only if it's not today
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (!isToday) {
      const isCurrentYear = date.getFullYear() === now.getFullYear();
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: 'short',
        ...(isCurrentYear ? {} : { year: 'numeric' }) // Include year only if not the current year
      });
      formattedDate += `, ${dateFormatter.format(date)}`;
    }
    return formattedDate;
  }

  return (
    <View style={styles.container}>
      {lastSaved && (
        <Text style={styles.title}>Last saved at {formatDate(lastSaved)}</Text>
      )}
      <Text style={styles.title}>Dynamic Todo List App</Text>

      {/* Section to add a new list */}
      <View style={styles.listInputContainer}>
        <TextInput
          style={styles.input}
          placeholder="To-do list name"
          value={newListName}
          onChangeText={setNewListName}
        />
        <Button title="Add list" onPress={createList} />
      </View>

      {/* Display list of lists */}
      <View style={styles.listContainer}>
        {lists.map(renderList)}
      </View>

      {/* Section for adding a new card under the selected list */}
      {selectedListId && (
        <View style={styles.inputContainer}>
          <Text style={styles.selectedListTitle}>
            Cards for "{lists.find(list => list.id === selectedListId)?.name}"
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Add a new card"
            value={newCardText}
            onChangeText={setNewCardText}
          />
          <Button title="Add Card" onPress={createCard} />
        </View>
      )}

      {/* List cards for the selected list */}
      {selectedListId && (
        <FlatList
          data={cards.filter(card => card.listId === selectedListId)}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          style={{ marginTop: 20 }}
        />
      )}
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: height * 0.05,    // 5% of screen height
    paddingRight: width * 0.15,   // 13% of screen width
    paddingBottom: height * 0.05, // 13% of screen height
    paddingLeft: width * 0.15,    // 5% of screen width
    marginTop: 50,
  }, title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  listInputContainer: { flexDirection: 'row', marginBottom: 20 },
  // input: { flex: 1, borderColor: '#ccc', borderWidth: 1, marginRight: 10, paddingHorizontal: 10 },
  input: {
    width: '100%',   // Increase this percentage to your desired width
    borderColor: '#ccc',
    height: 34,
    borderWidth: 1,
    marginRight: 10,
    paddingHorizontal: 10
  },
  listContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  listWrapper: { flexDirection: 'row', alignItems: 'center', margin: 5 },
  listButton: { padding: 10, backgroundColor: '#ddd', borderRadius: 5 },
  selectedList: { backgroundColor: '#bbb' },
  listText: { fontSize: 16 },
  listInput: { flex: 1, borderColor: '#ccc', borderWidth: 1, paddingHorizontal: 10 },
  selectedListTitle: { fontSize: 18, marginBottom: 10, textAlign: 'center' },
  inputContainer: { marginBottom: 20 },
  cardItem: { padding: 10, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center' },
  newCardText: { flex: 1 },
  cardInput: { flex: 1, borderColor: '#ccc', borderWidth: 1, marginRight: 10, paddingHorizontal: 10 }
});

export default App;
