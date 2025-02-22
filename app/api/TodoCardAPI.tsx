import API, { SuccessResponse } from "./API";
import TodoCard from "../models/TodoCard";

export default class TodoCardAPI extends API {
    protected endpoint: string;

    constructor() {
        super();
        this.endpoint = this.endpoints.TodoCards || '';
    }

    async createTodoCard(card: TodoCard) {
        const response = await this.base.post<SuccessResponse>(this.endpoint, card);
        return response.data;
    }

    async readTodoCards() {
        const response = await this.base.get<TodoCard[]>(this.endpoint);
        response.data = response.data.map(card => ({
            ...card,
            createdAt: new Date(card.createdAt),
            updatedAt: new Date(card.updatedAt)
        }));
        return response.data;
    }

    async updateTodoCard(card: TodoCard) {
        const response = await this.base.put<SuccessResponse>(`${this.endpoint}${card.id || 0}/`, card);
        return response.data;
    }

    async deleteTodoCard(id: TodoCard['id']) {
        const response = await this.base.delete<SuccessResponse>(`${this.endpoint}${id}`);
        return response.data;
    }
}