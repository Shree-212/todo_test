import API from "./API";
import LastSaved from "../models/LastSaved";
import { API_BASE_URL } from '@env';

export default class LastSavedAPI extends API {
    protected endpoint: string;

    constructor() {
        super(axios.create({
            baseURL: API_BASE_URL || 'http://localhost:8000/',
            headers: {
                'Content-Type': 'application/json'
            }
        }));
        this.endpoint = this.endpoints.lastSaved || '';
    }

    async readLastSaved() {
        let response = await this.base.get<LastSaved>(this.endpoint);
        response.data["timestamp"] = new Date(response.data.timestamp);
        return response.data;
    }
}