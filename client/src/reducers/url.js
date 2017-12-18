import { UPDATE_URL } from '../actions/url';

const defaultState = {
    url: "localhost:8080"
}

const url = (state = defaultState, action) => {
    switch (action.type) {
        case UPDATE_URL:
            return {
                ...state,
                url: action.url
            };
        default:
            return state;
    }
};

export default url;
