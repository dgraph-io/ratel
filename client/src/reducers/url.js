import { UPDATE_URL } from "../actions/url";

import { getDefaultUrl } from "../lib/helpers";

const URL_HISTORY_LENGTH = 5;

const defaultState = {
    url: getDefaultUrl(),
    urlHistory: ["https://play.dgraph.io/"],
};

function addUrlToHistory(curHistory, url) {
    if (!url) {
        return curHistory;
    }
    // Add url to the top of the list, removing duplicates.
    const res = (curHistory || []).filter(x => x !== url);
    res.splice(0, 0, url);
    // Limit to max history length
    return res.slice(0, URL_HISTORY_LENGTH);
}

export default function url(state = defaultState, action) {
    switch (action.type) {
        case UPDATE_URL:
            return {
                ...state,
                urlHistory: addUrlToHistory(state.urlHistory, action.url),
                url: action.url,
            };
        default:
            return state;
    }
}
