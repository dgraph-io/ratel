import { makeFrame } from "../lib/helpers";
import { receiveFrame, setActiveFrame } from "./frames";

/**
 * runQuery runs the query and displays the appropriate result in a frame
 * @params query {String}
 * @params action {String}
 * @params [frameId] {String}
 *
 */
export function runQuery(query, action = "query") {
    return dispatch => {
        const frame = makeFrame({ query, action });
        dispatch(receiveFrame(frame));
        dispatch(setActiveFrame(frame.id));
    };
}
