import { persistCombineReducers } from "redux-persist";

import frames from "./frames";
import connection from "./connection";
import query from "./query";
import url from "./url";

const makeRootReducer = (config) => persistCombineReducers(config, {
    frames,
    connection,
    query,
    url
});

export default makeRootReducer;
