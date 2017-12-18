import { UPDATE_CONNECTED_STATE, UPDATE_SHOULD_PROMPT, UPDATE_REFRESHING } from '../actions/connection';

const defaultState = {
    connected: false,
    shouldPrompt: false,
    refreshing: false
}

const connection = (state = defaultState, action) => {
    switch (action.type) {
        case UPDATE_CONNECTED_STATE:
            return {
                ...state,
                connected: action.connected,
                shouldPrompt: !action.connected,
                refreshing: false
            };
        case UPDATE_SHOULD_PROMPT:
            return {
                ...state,
                shouldPrompt: !state.connected,
                refreshing: false
            };
        case UPDATE_REFRESHING:
            return {
                ...state,
                refreshing: action.refreshing
            };
        default:
            return state;
    }
};

export default connection;
