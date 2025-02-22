import API from "./API";
import LastSaved from "../models/LastSaved";

export default class LastSavedAPI extends API {
    protected endpoint: string;

    constructor() {
        super();
        this.endpoint = this.endpoints.lastSaved || '';
    }

    async readLastSaved() {
        let response = await this.base.get<LastSaved>(this.endpoint);
        response.data["timestamp"] = new Date(response.data.timestamp);
        return response.data;
    }
}