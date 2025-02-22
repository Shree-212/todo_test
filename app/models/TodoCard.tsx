export default interface TodoCard {
    id: string;
    text: string;
    listId: string;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
}