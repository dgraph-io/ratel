/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import uuid from "uuid"

import { executeQuery } from "lib/helpers"

export const RECEIVE_FRAME = "frames/RECEIVE_FRAME"
export const DISCARD_FRAME = "frames/DISCARD_FRAME"
export const DISCARD_ALL_FRAMES = "frames/DISCARD_ALL_FRAMES"
export const SET_ACTIVE_FRAME = "frames/SET_ACTIVE_FRAME"
export const SET_RESULTS_TAB = "frames/SET_RESULTS_TAB"
export const START_FRAME_EXECUTION = "frames/START_FRAME_EXECUTION"

export const EXECUTE_FRAME = "frames/EXECUTE_FRAME"
export const FRAME_REQUEST_ERROR = "frames/FRAME_REQUEST_ERROR"
export const FRAME_REQUEST_COMPLETED = "frames/FRAME_REQUEST_COMPLETED"

export const TAB_VISUAL = "graph"
export const TAB_JSON = "json"
export const TAB_QUERY = "userQuery"
export const TAB_GEO = "geo"
export const TAB_TIMELINE = "timeline"

export const ALLOWED_RESULT_TABS = [TAB_VISUAL, TAB_JSON, TAB_QUERY, TAB_GEO, TAB_TIMELINE]

export function receiveFrame(frame) {
    return {
        type: RECEIVE_FRAME,
        frame,
    }
}

/**
 * runQuery runs the query and displays the appropriate result in a frame
 *
 */
export function runQuery(query, action = "query", queryOptions = {}) {
    return (dispatch) => {
        const frame = {
            action,
            id: uuid(),
            timestamp: Date.now(),
            query,
            queryOptions: action === "query" ? queryOptions : {},
        }
        dispatch(receiveFrame(frame))
        dispatch(setActiveFrame(frame.id))
        dispatch(executeFrame(frame.id))
    }
}

export function discardFrame(frameId) {
    return {
        type: DISCARD_FRAME,
        frameId,
    }
}

export function setActiveFrame(frameId) {
    return {
        type: SET_ACTIVE_FRAME,
        frameId,
    }
}

export function setResultsTab(tab) {
    return (dispatch, getState) => {
        if (ALLOWED_RESULT_TABS.indexOf(tab) < 0) {
            tab = TAB_JSON
        }
        dispatch({
            type: SET_RESULTS_TAB,
            tab,
        })
        dispatch(executeFrame(getState().frames.activeFrameId))
    }
}

function getQueryVars(frame) {
    const vars = {}
    ;(frame.queryOptions?.queryVars || []).forEach(([checked, val]) => {
        if (!checked) {
            return
        }
        const splitPos = val.indexOf(":")
        if (splitPos < 0) {
            return
        }
        const name = val.slice(0, splitPos)
        let body = val.substring(splitPos + 1)
        if (body[0] === " ") {
            body = body.slice(1)
        }
        vars["$" + name.trim()] = body
    })
    return vars
}

export function executeFrame(frameId) {
    return async (dispatch, getState) => {
        const { frames } = getState()

        if (frames.tab === TAB_QUERY) {
            return
        }

        const frameResult = frames.frameResults[frameId] || {}
        const frame = frames.items.find((x) => x.id === frameId)

        if (!frame) {
            return
        }

        const { action, query } = frame

        const tabName =
            action === "mutate" || frames.tab === "geo" || frames.tab === "timeline"
                ? TAB_JSON
                : frames.tab
        const tabResult = frameResult[tabName] || {}

        if (!tabResult.canExecute) {
            // This tab has been executed already.
            return
        }

        dispatch(startFrameExecution(frameId, tabName))

        try {
            const isQuery = action === "query"
            const response = await executeQuery(query, {
                action,
                debug: tabName === "graph",
                readOnly: isQuery && frame.queryOptions?.readOnly,
                bestEffort: isQuery && frame.queryOptions?.bestEffort,
                queryVars: isQuery ? getQueryVars(frame) : undefined,
            })
            dispatch(frameRequestCompleted(frameId, tabName, response))
        } catch (error) {
            console.error("Frame error", error)
            dispatch(frameRequestError(frameId, tabName, error))
        }
    }
}

export function startFrameExecution(frameId, tabName) {
    return {
        type: START_FRAME_EXECUTION,
        frameId,
        tabName,
        executionStart: Date.now(),
    }
}

export function frameRequestError(frameId, tabName, error) {
    return {
        type: FRAME_REQUEST_ERROR,
        frameId,
        tabName,
        error,
    }
}

export function frameRequestCompleted(frameId, tabName, response) {
    return {
        type: FRAME_REQUEST_COMPLETED,
        frameId,
        tabName,
        response,
    }
}
