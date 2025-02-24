import { useEffect, useState } from 'react';
import TodoList from './models/TodoList';
import TodoCard from './models/TodoCard';
import { createTodoCard, createTodoList, deleteTodoCard, deleteTodoList, readLastSaved, readTodoCards, readTodoLists, SuccessResponse, syncToCloud, updateTodoCard, updateTodoList } from './api';
import { v4 } from 'uuid';
import LastSaved from './models/LastSaved';
import { TextInput, TouchableOpacity, View, Text } from 'react-native';
import { Checkbox } from "react-native-paper";
import styles from './styles';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { getLocalData, saveLocalData } from './localStorage';

type APIResponse = SuccessResponse | TodoList[] | TodoCard[] | LastSaved;

export default function App() {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [editingListId, setEditingListId] = useState<TodoList["id"] | null>(null);
  const [editingListName, setEditingListName] = useState<TodoList["name"]>('');
  const [cards, setCards] = useState<TodoCard[]>([]);
  const [creatingCard, setCreatingCard] = useState(false);
  const [newCardText, setNewCardText] = useState<TodoCard["text"]>('');
  const [selectedListId, setSelectedListId] = useState<TodoList["id"] | null>(null);
  const [editingCardId, setEditingCardId] = useState<TodoCard["id"] | null>(null);
  const [editingCardText, setEditingCardText] = useState<TodoCard["text"]>('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  async function executeApiCall(apiCall: () => Promise<APIResponse>, then?: (response: APIResponse) => void) {
    try {
      const response = await apiCall();
      if (!response || ("success" in response && !response.success) || (Array.isArray(response) && response.length === 0)) {
        throw response;
      }
      const lastSavedResponse = await readLastSaved();
      setLastSaved(lastSavedResponse.timestamp);
      saveLocalData('lastSaved', lastSavedResponse.timestamp);
      if (then) {
        then(response);
      }
    } catch (error: any) {
      if (error && "code" in error && error["code"] == "ERR_NETWORK") {
        // Offline
        saveLocalData('syncNeeded', true);
      }
      console.error("API call failed:", error);
    }
  }

  // Fetch lists & cards
  useEffect(() => {
    (async () => {
      const localLists = await getLocalData('lists');
      setLists(localLists as TodoList[] || []);
      const localCards = await getLocalData('cards');
      setCards(localCards as TodoCard[] || []);
      const localLastSaved = await getLocalData('lastSaved');
      setLastSaved(localLastSaved.timestamp);
      const syncNeeded = await getLocalData('syncNeeded');
      if (syncNeeded) {
        await executeApiCall(() => syncToCloud(localLists, localCards));
        await saveLocalData('syncNeeded', false);
      }
      else {
        await executeApiCall(
          readTodoLists,
          (response) => {
            setLists(response as TodoList[]);
            saveLocalData('lists', response);
          }
        );
        await executeApiCall(
          readTodoCards,
          (response) => {
            setCards(response as TodoCard[]);
            saveLocalData('cards', response);
          }
        );
      }
    })()
  }, []);

  // Validate list name
  function listNameIsValid(name: string) {
    if (!name) {
      Toast.show({
        type: 'error',
        text1: 'List name cannot be empty',
      });
      return false;
    }
    if (lists.some(list => list.name.toLowerCase() === name.toLowerCase())) {
      Toast.show({
        type: 'error',
        text1: `"${name}" list name already exists`,
      });
      return false;
    }
    return true;
  }

  // Create a new to-do list
  function createList() {
    const newList = {
      id: v4(),
      name: 'List no. ' + (lists.length + 1)
    };
    setLists(prev => {
      const newLists = [...prev, newList]
      saveLocalData('lists', newLists);
      return newLists
    });
    executeApiCall(() => createTodoList(newList));
  }

  // Start editing a to-do list
  function startEditingList(list: TodoList) {
    cancelEditingCard();
    cancelEditingList();
    cancelCreatingCard();
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
    cancelEditingList();
    if (!editingListId) {
      return;
    }
    const name = editingListName.trim();
    if (!listNameIsValid(name)) {
      return;
    }
    const updatedList = { id: editingListId, name };
    setLists(lists.map(list => list.id === editingListId ? updatedList : list));
    saveLocalData('lists', lists.map(list => list.id === editingListId ? updatedList : list));
    executeApiCall(() => updateTodoList(updatedList));
  }

  // Delete a to-do list
  function deleteList(id: TodoList["id"]) {
    setLists(lists.filter(list => list.id !== id));
    saveLocalData('lists', lists.filter(list => list.id !== id));
    // Remove cards associated with the deleted list
    setCards(cards.filter(card => card.listId !== id));
    saveLocalData('cards', cards.filter(card => card.listId !== id));
    executeApiCall(() => deleteTodoList(id));
  }

  // Validate card text
  function cardIsValid(card: TodoCard) {
    if (!card.text) {
      Toast.show({
        type: 'error',
        text1: 'Task cannot be empty',
      });
      return false;
    }
    if (cards.some(c => c.listId === card.listId && c.text.toLowerCase() === card.text.toLowerCase())) {
      Toast.show({
        type: 'error',
        text1: 'Task already exists',
      });
      return false;
    }
    return true;
  }

  // Add a new to-do card in the selected list
  function createCard(listId: TodoList["id"]) {
    const newCard = {
      id: v4(),
      text: newCardText.trim(),
      listId,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    if (!cardIsValid(newCard)) {
      return;
    }
    setCards(cards => {
      const newCards = [...cards, newCard];
      saveLocalData('cards', newCards);
      return newCards;
    });
    cancelCreatingCard();
    executeApiCall(() => createTodoCard(newCard));
  }

  // Start creating a new to-do card
  function startCreatingCard(listId: TodoList["id"]) {
    cancelEditingCard();
    cancelEditingList();
    cancelCreatingCard();
    setCreatingCard(true);
    setSelectedListId(listId);
  }

  // Cancel creating a new to-do card
  function cancelCreatingCard() {
    setCreatingCard(false);
    setNewCardText('');
    setSelectedListId(null);
  }

  // Start editing a to-do card
  function startEditingCard(card: TodoCard) {
    cancelEditingCard();
    cancelEditingList();
    cancelCreatingCard();
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
    cancelEditingCard();
    if (!editingCardId) {
      return;
    }
    let updatedCard = cards.find(card => card.id === editingCardId);
    if (!updatedCard) {
      return;
    }
    updatedCard = {
      ...updatedCard,
      text: editingCardText,
      updatedAt: new Date()
    }
    if (!cardIsValid(updatedCard)) {
      return;
    }
    setCards(cards.map(card => card.id === editingCardId ? updatedCard : card));
    saveLocalData('cards', cards.map(card => card.id === editingCardId ? updatedCard : card));
    executeApiCall(() => updateTodoCard(updatedCard));
  }

  // Delete a to-do card
  function deleteCard(id: TodoCard["id"]) {
    setCards(cards.filter(card => card.id !== id));
    saveLocalData('cards', cards.filter(card => card.id !== id));
    executeApiCall(() => deleteTodoCard(id));
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
    saveLocalData('cards', cards.map(card => card.id === id ? updatedCard : card));
    executeApiCall(() => updateTodoCard(updatedCard));
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
    <View style={styles.wrapper}>
      <Text style={styles.heading}>To-do or not to-do?</Text>
      <Text style={styles.lastSaved}>{lastSaved ? `Changes last saved at ${formatDate(lastSaved)}` : ''}</Text>
      <View style={styles.container}>
        <View style={styles.lists}>
          {lists.map((list, index) => (
            <View style={styles.list} key={list.id}>
              {
                editingListId === list.id ?
                  <View style={styles.listHeader}>
                    <TextInput
                      style={styles.listNameInput}
                      value={editingListName}
                      onChangeText={setEditingListName}
                      autoFocus
                    />
                    <View style={styles.listActions}>
                      <TouchableOpacity style={styles.editListBtn} onPress={updateList}>
                        <MaterialIcons name="save" size={20} color={'#fff'} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelBtn} onPress={cancelEditingList}>
                        <MaterialIcons name="cancel" size={20} color={'#fff'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  :
                  <View style={styles.listHeader}>
                    <Text style={styles.listName}>#{index + 1}: {list.name}</Text>
                    <View style={styles.listActions}>
                      <TouchableOpacity style={{ marginRight: 15 }} onPress={() => startEditingList(list)}>
                        <MaterialIcons name="edit" size={20} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteList(list.id)}>
                        <MaterialIcons name="delete" size={20} />
                      </TouchableOpacity>
                    </View>
                  </View>
              }
              <View style={styles.cards}>
                {
                  cards.map(card => {
                    if (card.listId === list.id) {
                      return (
                        <View style={styles.card} key={card.id}>
                          {
                            editingCardId === card.id ?
                              <View style={styles.cardHeader}>
                                <TextInput
                                  style={styles.cardTextInput}
                                  value={editingCardText}
                                  onChangeText={setEditingCardText}
                                  autoFocus
                                />
                                <View style={styles.cardActions}>
                                  <TouchableOpacity style={styles.editListBtn} onPress={updateCard}>
                                    <MaterialIcons name="save" size={20} color={'#fff'} />
                                  </TouchableOpacity>
                                  <TouchableOpacity style={styles.cancelBtn} onPress={cancelEditingCard}>
                                    <MaterialIcons name="cancel" size={20} color={'#fff'} />
                                  </TouchableOpacity>
                                </View>
                              </View>
                              :
                              <View style={styles.cardHeader}>
                                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                  <Checkbox status={card.completed ? 'checked' : 'unchecked'} onPress={() => toggleCardCompletion(card.id)} />
                                  <Text style={card.completed ? styles.completedTask : {}}>{card.text}</Text>
                                </View>
                                <View style={styles.cardActions}>
                                  <TouchableOpacity style={{ marginRight: 15 }} onPress={() => startEditingCard(card)}>
                                    <MaterialIcons name="edit" size={20} />
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => deleteCard(card.id)}>
                                    <MaterialIcons name="delete" size={20} />
                                  </TouchableOpacity>
                                </View>
                              </View>
                          }
                        </View>
                      );
                    }
                  })
                }
              </View>
              {
                creatingCard && selectedListId === list.id ?
                  <View style={styles.cardInputContainer}>
                    <TextInput
                      style={styles.cardTextInput}
                      value={newCardText}
                      onChangeText={setNewCardText}
                      autoFocus
                    />
                    {
                      <View style={styles.cardActions}>
                        <TouchableOpacity style={styles.editListBtn} onPress={() => createCard(list.id)}>
                          <MaterialIcons name="save" size={20} color={'#fff'} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={cancelCreatingCard}>
                          <MaterialIcons name="cancel" size={20} color={'#fff'} />
                        </TouchableOpacity>
                      </View>
                    }
                  </View>
                  :
                  <TouchableOpacity style={styles.addCard} onPress={() => startCreatingCard(list.id)}>
                    <MaterialIcons name="add" size={16} color={'#fff'} />
                    <Text style={styles.addText}>Add new task</Text>
                  </TouchableOpacity>
              }
            </View>
          ))}
        </View>
      </View>
      <TouchableOpacity style={styles.addList} onPress={createList}>
        <MaterialIcons name="add" size={16} color={'#fff'} />
        <Text style={styles.addText}>Add new list</Text>
      </TouchableOpacity>
      <Toast />
    </View>
  );
}
