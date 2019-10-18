// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import produce from "immer";

import {
    SET_PANEL_MINIMIZED,
    SET_PANEL_SIZE,
    CLICK_SIDEBAR_URL,
} from "../actions/ui";

const defaultState = {
    width: 100,
    height: 100,

    mainFrameUrl: "",
    overlayUrl: null,
};

const isMainFrameUrl = sidebarMenu =>
    ["", "acl", "backups", "schema"].indexOf(sidebarMenu) >= 0;

export default (state = defaultState, action) =>
    produce(state, draft => {
        switch (action.type) {
            case SET_PANEL_MINIMIZED:
                draft.panelMinimized = action.minimized;
                break;

            case SET_PANEL_SIZE:
                draft.panelHeight = action.height;
                draft.panelWidth = action.width;
                break;

            case CLICK_SIDEBAR_URL:
                const url = action.url;
                if (isMainFrameUrl(url)) {
                    draft.mainFrameUrl = url;
                    draft.overlayUrl = null;
                } else {
                    draft.overlayUrl = draft.overlayUrl === url ? null : url;
                }
                break;

            default:
                return;
        }
    });
