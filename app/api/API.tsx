import axios from 'axios';
import Endpoints from './Endpoints';

export interface SuccessResponse {
    success: boolean;
    id?: string;
}

export default class API {
    protected readonly base: Axios.AxiosInstance;
    protected readonly endpoints: Endpoints;
    
    constructor(
        base: Axios.AxiosInstance = axios.create({
            baseURL: process.env.API_BASE_URL || 'http://localhost:8000/',
            headers: {
                'Content-Type': 'application/json'
            }
        }),
        endpoints: Endpoints = {
            todoLists: '/todo-lists/',
            todoCards: '/todo-cards/',
            lastSaved: '/last-saved/'
        }
    ) {
        this.base = base;
        this.endpoints = endpoints;
    }
}