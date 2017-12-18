import { UPDATE_URL } from '../actions/url';

import { getDefaultUrl } from '../lib/helpers';

const defaultState = {
    url: getDefaultUrl()
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
