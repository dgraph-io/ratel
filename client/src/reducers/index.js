import { combineReducers } from "redux";

import frames from "./frames";
import connection from "./connection";
import query from "./query";
import url from "./url";

const rootReducer = combineReducers({
    frames,
    connection,
    query,
    url
});

export default rootReducer;
