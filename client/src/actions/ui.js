export const SET_PANEL_SIZE = "ui/SET_PANEL_SIZE";

export function setPanelSize({ width, height }) {
    return {
        type: SET_PANEL_SIZE,
        width,
        height,
    };
}
