import API, { SuccessResponse } from "./API";
import TodoList from "../models/TodoList";
import { API_BASE_URL } from '@env';
import axios from 'axios';

export default class TodoListAPI extends API {
    protected endpoint: string;

    constructor() {
        super(axios.create({
            baseURL: API_BASE_URL || 'http://localhost:8000/',
            headers: {
                'Content-Type': 'application/json'
            }
        }));
        this.endpoint = this.endpoints.todoLists || '';
    }

    async createTodoList(list: TodoList) {
        const response = await this.base.post<SuccessResponse>(this.endpoint, list);
        return response.data;
    }

    async readTodoLists() {
        const response = await this.base.get<TodoList[]>(this.endpoint);
        return response.data;
    }

    async updateTodoList(list: TodoList) {
        const response = await this.base.put<SuccessResponse>(`${this.endpoint}${list.id}/`, list);
        return response.data;
    }

    async deleteTodoList(listId: TodoList['id']) {
        const response = await this.base.delete<SuccessResponse>(`${this.endpoint}${listId}/`);
        return response.data;
    }
}