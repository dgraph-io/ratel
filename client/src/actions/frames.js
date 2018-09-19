export const RECEIVE_FRAME = "frames/RECEIVE_FRAME";
export const DISCARD_FRAME = "frames/DISCARD_FRAME";
export const DISCARD_ALL_FRAMES = "frames/DISCARD_ALL_FRAMES";
export const UPDATE_FRAME = "frames/UPDATE_FRAME";
export const UPDATE_FRAMES_TAB = "frames/UPDATE_FRAMES_TAB";

export function receiveFrame({ id, type, meta, query, share, action }) {
    return {
        type: RECEIVE_FRAME,
        frame: {
            id,
            type,
            meta,
            query,
            share,
            action,
        },
    };
}

export function discardFrame(frameID) {
    return {
        type: DISCARD_FRAME,
        frameID,
    };
}

export function discardAllFrames() {
    return {
        type: DISCARD_ALL_FRAMES,
    };
}

// IDEA: the schema for frame object is getting complex. Maybe use class optionally
// with flow.
export function updateFrame({ id, type, meta, query, extraQuery, version }) {
    return {
        type: UPDATE_FRAME,
        id,
        frame: {
            meta: meta || {}, // default argument for meta
            type,
            query,
            extraQuery,
            version,
        },
    };
}

export function updateFramesTab(tab) {
    return {
        type: UPDATE_FRAMES_TAB,
        tab,
    };
}

// Helpers

/**
 * toggleCollapseFrame returns an action object that will change the `collapsed`
 * state of a frame.
 *
 * @params frame {Object} - target frame
 * @params [nextState] {Boolean} - optional param to dictate if the frame should
 *     collapse. If not provided, the action will toggle the collapsed state
 */
export function toggleCollapseFrame(frame, nextState) {
    let shouldCollapse;
    if (nextState) {
        shouldCollapse = nextState;
    } else {
        shouldCollapse = !frame.meta.collapsed;
    }

    return updateFrame({
        id: frame.id,
        type: frame.type,
        meta: { ...frame.meta, collapsed: shouldCollapse },
        query: frame.query,
    });
}
