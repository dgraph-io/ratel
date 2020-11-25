// Copyright 2017-2021 Dgraph Labs, Inc. and Contributors
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

export const SET_PANEL_SIZE = "ui/SET_PANEL_SIZE";
export const SET_PANEL_MINIMIZED = "ui/SET_PANEL_MINIMIZED";

export const CLICK_SIDEBAR_URL = "mainframe/CLICK_SIDEBAR_URL";

export function clickSidebarUrl(url) {
    return {
        type: CLICK_SIDEBAR_URL,
        url,
    };
}

export function setPanelSize({ width, height }) {
    return {
        type: SET_PANEL_SIZE,
        width,
        height,
    };
}

export function setPanelMinimized(minimized) {
    return {
        type: SET_PANEL_MINIMIZED,
        minimized,
    };
}
