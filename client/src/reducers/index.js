import { persistCombineReducers } from "redux-persist";

import frames from "./frames";
import connection from "./connection";
import query from "./query";
import url from "./url";

export default function makeRootReducer(config) {
    return persistCombineReducers(config, {
        frames,
        connection,
        query,
        url,
    });
}
