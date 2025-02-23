import axios from 'axios';
import { API_BASE_URL } from '@env';
import TodoList from './models/TodoList';
import TodoCard from './models/TodoCard';
import LastSaved from './models/LastSaved';

export interface SuccessResponse {
    success: boolean;
    id?: string;
}
const base = API_BASE_URL || 'http://localhost:8000';
const todoLists = `${base}/todo-lists/`;
const todoCards = `${base}/todo-cards/`;
const lastSaved = `${base}/last-saved/`;
const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

export async function createTodoList(list: TodoList) {
    const response = await axios.post<SuccessResponse>(todoLists, list, {headers});
    return response.data;
}

export async function readTodoLists() {
    const response = await axios.get<TodoList[]>(todoLists, {headers});
    return response.data;
}

export async function updateTodoList(list: TodoList) {
    const response = await axios.put<SuccessResponse>(`${todoLists}${list.id}/`, list, {headers});
    return response.data;
}

export async function deleteTodoList(listId: TodoList['id']) {
    const response = await axios.delete<SuccessResponse>(`${todoLists}${listId}/`, {headers});
    return response.data;
}

export async function createTodoCard(card: TodoCard) {
    const response = await axios.post<SuccessResponse>(todoCards, card, {headers});
    return response.data;
}

export async function readTodoCards() {
    const response = await axios.get<TodoCard[]>(todoCards, {headers});
    response.data = response.data.map(card => ({
        ...card,
        createdAt: new Date(card.createdAt),
        updatedAt: new Date(card.updatedAt)
    }));
    return response.data;
}

export async function updateTodoCard(card: TodoCard) {
    const response = await axios.put<SuccessResponse>(`${todoCards}${card.id || 0}/`, card, {headers});
    return response.data;
}

export async function deleteTodoCard(id: TodoCard['id']) {
    const response = await axios.delete<SuccessResponse>(`${todoCards}${id}/`, {headers});
    return response.data;
}

export async function readLastSaved() {
    let response = await axios.get<LastSaved>(lastSaved, {headers});
    response.data["timestamp"] = new Date(response.data.timestamp);
    return response.data;
}