export const SET_PANEL_SIZE = "ui/SET_PANEL_SIZE";
export const SET_PANEL_MINIMIZED = "ui/SET_PANEL_MINIMIZED";

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
