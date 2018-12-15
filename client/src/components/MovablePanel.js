import React from "react";
import classnames from "classnames";
import Draggable from "react-draggable";

const COLLAPSED_HEIGHT = 25;

const MIN_WIDTH = 150;
const MIN_HEIGHT = COLLAPSED_HEIGHT;

const MIN_GAP_WIDTH = 5;
const MIN_GAP_HEIGHT = 5;

export default function MovablePanel({
    boundingSelector,
    children,
    collapsed,
    minimized,
    title,
    width,
    height,
    onResize,
    onSetPanelMinimized,
}) {
    width = width || MIN_WIDTH;
    height = collapsed || minimized ? COLLAPSED_HEIGHT : height || MIN_HEIGHT;

    const getAndUpdateBoundSize = (width, height) => {
        const el = document.querySelector(boundingSelector);
        const maxW = !el ? 2000 : el.clientWidth - MIN_GAP_WIDTH;
        const maxH = !el ? 1000 : el.clientHeight - MIN_GAP_HEIGHT;

        const boundSize = {
            width: Math.max(MIN_WIDTH, Math.min(width, maxW)),
            height: Math.max(MIN_HEIGHT, Math.min(height, maxH)),
        };
        if (boundSize.width !== width || boundSize.height !== height) {
            window.setTimeout(() => onResize(boundSize), 0);
        }
        return boundSize;
    };

    const _onDrag = e =>
        onResize(
            getAndUpdateBoundSize(width - e.movementX, height - e.movementY),
        );

    const minimize = () => onSetPanelMinimized(true);
    const restore = () => onSetPanelMinimized(false);

    getAndUpdateBoundSize(width, height);

    return (
        <div
            className={classnames("graph-overlay", { collapsed })}
            style={{ width, height }}
        >
            <div className="title">
                {collapsed ? null : (
                    <Draggable
                        onDrag={_onDrag}
                        bounds=".graph-container"
                        position={{ x: 0, y: 0 }}
                    >
                        <div className="panel-btn">
                            <i className="fas fa-arrows-alt" />
                        </div>
                    </Draggable>
                )}
                {!collapsed && !minimized ? (
                    <div className="panel-btn" onClick={minimize}>
                        <i className="far fa-window-minimize" />
                    </div>
                ) : null}
                {!collapsed && minimized ? (
                    <div className="panel-btn" onClick={restore}>
                        <i className="far fa-window-restore" />
                    </div>
                ) : null}
                {title}
            </div>
            {children}
        </div>
    );
}
