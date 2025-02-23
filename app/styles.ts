import { DimensionValue, StyleSheet } from "react-native";

export default StyleSheet.create({
    wrapper: {
        backgroundColor: '#583101',
        height: '100%',
        display: 'flex',
        padding: 20
    },
    container: {
        margin: 10,
        padding: 20,
        borderRadius: 10,
        height: 'calc(100% - 140px)' as DimensionValue,
        overflowY: 'auto',
        backgroundColor: '#8b5e34'
    },
    heading: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: "#e9ecef",
    },
    lastSaved: {
        fontSize: 16,
        marginBottom: 10,
        textDecorationLine: 'underline',
        textAlign: 'center',
        color: "#e9ecef",
    },
    lists: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    list: {
        backgroundColor: '#E0D68A',
        padding: 20,
        color: '#000',
        marginBottom: 20,
        borderRadius: 10,
        flexWrap: 'wrap',
        width: '31%',
        minWidth: '300px' as DimensionValue,
        marginHorizontal: '1%',
    },
    addList: {
        backgroundColor: '#2b9348',
        padding: 10,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        borderRadius: 10,
        marginHorizontal: 'auto'
    },
    editListBtn: {
        backgroundColor: '#2b9348',
        padding: 5,
        borderRadius: 5,
        marginHorizontal: 5
    },
    cancelBtn: {
        backgroundColor: '#dc3545',
        padding: 5,
        borderRadius: 5
    },
    addText: {
        display: 'flex',
        flexDirection: 'row',
        fontSize: 16,
        color: '#fff',
        marginLeft: 5
    },
    listHeader: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    listName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        padding: 5,

    },
    listNameInput: {
        fontSize: 18,
        backgroundColor: '#e9ecef',
        padding: 5,
        flexGrow: 1,
        borderRadius: 5,
    },
    listActions: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    addCard: {
        color: '#6c757d',
        textAlign: 'center',
        marginTop: 20,
        backgroundColor: '#2b9348',
        padding: 10,
        display: 'flex',
        flexDirection: 'row',
        width: 'fit-content' as DimensionValue,
        alignItems: 'center',
        borderRadius: 10,
        justifyContent: 'center',
    },
    cards: {
        height: '200px' as DimensionValue,
        paddingRight: 10,
        overflowY: 'auto'
    },
    card: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardHeader: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    cardInputContainer: {
        marginTop: 20,
        display: 'flex',
        flexDirection: 'row',
    },
    cardTextInput: {
        fontSize: 18,
        backgroundColor: '#e9ecef',
        padding: 5,
        flexGrow: 1,
        borderRadius: 5,
    },
    completedTask: {
        textDecorationLine: 'line-through',
    },
    cardActions: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
});