import { useEffect, useState } from 'react';
import TodoList from './models/TodoList';
import TodoCard from './models/TodoCard';
import { v4 } from 'uuid';
import { TextInput, TouchableOpacity, View, Text } from 'react-native';
import { Checkbox } from "react-native-paper";
import styles from './styles';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import * as storage from './localStorage';
import { syncManager } from './services/sync';
import { getStorageLocation, exportStorageData } from './utils/storage-debug';

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

  // Initialize app with localStorage instead of database
  useEffect(() => {
    let isMounted = true;

    const initApp = async () => {
      try {
        await storage.initStorage();

        // Log storage location in development
        if (__DEV__) {
          await getStorageLocation();
        }

        const [localLists, localCards] = await Promise.all([
          storage.getLists(),
          storage.getCards()
        ]);

        if (isMounted) {
          setLists(localLists);
          setCards(localCards);
        }
      } catch (error) {
        console.error('App initialization failed:', error);
        if (isMounted) {
          Toast.show({
            type: 'error',
            text1: 'Failed to initialize app'
          });
        }
      }
    };

    initApp();

    return () => {
      isMounted = false;
      syncManager.destroy();
    };
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
  async function createList() {
    const newList: TodoList = {
      id: v4(),
      name: `List no. ${(lists.length + 1)}`,
      updated_at: Date.now(),
      is_synced: 0
    };
    
    try {
      await storage.createList(newList);
      setLists(prev => [...prev, newList]);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to create list'
      });
    }
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
  async function updateList() {
    if (!editingListId || !editingListName.trim()) return;

    const updatedList: TodoList = {
      id: editingListId,
      name: editingListName.trim(),
      updated_at: Date.now(),
      is_synced: 0
    };

    try {
      await storage.updateList(updatedList);
      setLists(lists.map(list => list.id === editingListId ? updatedList : list));
      cancelEditingList();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update list'
      });
      console.error('Failed to update list:', error);
    }
  }

  // Delete a to-do list
  async function deleteList(id: string) {
    try {
      await storage.deleteList(id);
      setLists(lists.filter(list => list.id !== id));
      setCards(cards.filter(card => card.listId !== id));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to delete list'
      });
      console.error('Failed to delete list:', error);
    }
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
  async function createCard(listId: TodoList["id"]) {
    const newCard: TodoCard = {
      id: v4(),
      text: newCardText.trim(),
      listId,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      is_synced: 0
    };

    if (!cardIsValid(newCard)) {
      return;
    }

    try {
      await storage.createCard(newCard);
      setCards(prev => [...prev, newCard]);
      cancelCreatingCard();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to create task'
      });
      console.error('Failed to create card:', error);
    }
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
  async function updateCard() {
    if (!editingCardId || !editingCardText.trim()) {
      return;
    }

    const existingCard = cards.find(card => card.id === editingCardId);
    if (!existingCard) {
      return;
    }

    const updatedCard: TodoCard = {
      ...existingCard,
      text: editingCardText.trim(),
      updatedAt: new Date(),
      is_synced: 0
    };

    if (!cardIsValid(updatedCard)) {
      return;
    }

    try {
      await storage.updateCard(updatedCard);
      setCards(prev => prev.map(card => card.id === editingCardId ? updatedCard : card));
      cancelEditingCard();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update task'
      });
      console.error('Failed to update card:', error);
    }
  }

  // Delete a to-do card
  async function deleteCard(id: TodoCard["id"]) {
    try {
      await storage.deleteCard(id);
      setCards(prev => prev.filter(card => card.id !== id));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to delete task'
      });
      console.error('Failed to delete card:', error);
    }
  }

  // Toggle to-card completion status
  async function toggleCardCompletion(id: TodoCard["id"]) {
    const selectedCard = cards.find(card => card.id === id);
    if (!selectedCard) {
      return;
    }

    const updatedCard: TodoCard = {
      ...selectedCard,
      completed: !selectedCard.completed,
      updatedAt: new Date(),
      is_synced: 0
    };

    try {
      await storage.updateCard(updatedCard);
      setCards(prev => prev.map(card => card.id === id ? updatedCard : card));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update task status'
      });
      console.error('Failed to toggle card completion:', error);
    }
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
