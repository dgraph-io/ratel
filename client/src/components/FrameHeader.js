import React from "react";

import QueryPreview from "./QueryPreview";

export default function FrameHeader({
    frame,
    shareId,
    shareHidden,
    isFullscreen,
    onToggleFullscreen,
    onToggleCollapse,
    onToggleEditingQuery,
    onDiscardFrame,
    saveShareURLRef,
    editingQuery,
    isCollapsed,
    onSelectQuery,
}) {
    return (
        <div className="header">
            {frame.query ? (
                <QueryPreview
                    query={frame.query}
                    action={frame.action}
                    onSelectQuery={onSelectQuery}
                />
            ) : null}

            <div className="actions">
                {isFullscreen ? null : (
                    <a
                        href="#expand-toggle"
                        className="action"
                        onClick={e => {
                            e.preventDefault();
                            onToggleCollapse();
                        }}
                    >
                        {isCollapsed ? (
                            <i className="fa fa-chevron-down" />
                        ) : (
                            <i className="fa fa-chevron-up" />
                        )}
                    </a>
                )}

                <a
                    href="#fullscreen-toggle"
                    className="action"
                    onClick={e => {
                        e.preventDefault();
                        if (isCollapsed) {
                            onToggleCollapse();
                        }
                        setTimeout(() => onToggleFullscreen(), 0);
                    }}
                >
                    {isFullscreen ? (
                        <i className="fa fa-compress" />
                    ) : (
                        <i className="fa fa-expand" />
                    )}
                </a>

                {!isFullscreen ? (
                    <a
                        href="#discard"
                        className="action"
                        onClick={e => {
                            e.preventDefault();
                            onDiscardFrame(frame.id);
                        }}
                    >
                        <i className="fas fa-trash" />
                    </a>
                ) : null}
            </div>
        </div>
    );
}
