import React from "react";
import classnames from "classnames";

import QueryPreview from "./QueryPreview";

import { getShareURL } from "../lib/helpers";

export default function FrameHeader({
    frame,
    shareId,
    shareHidden,
    isFullscreen,
    onShare,
    onToggleFullscreen,
    onToggleCollapse,
    onToggleEditingQuery,
    onDiscardFrame,
    saveShareURLRef,
    editingQuery,
    isCollapsed,
    onSelectQuery,
}) {
    const shareURLValue = shareId ? getShareURL(shareId) : "";

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
                {
                    /* <a
                        href="#share"
                        className="action"
                        onClick={e => {
                            e.preventDefault();
                            onShare();
                        }}
                    >
                        <i className="fa fa-share-alt" />
                    </a> */ null
                }
                <input
                    type="text"
                    value={shareURLValue}
                    className={classnames("share-url-holder", {
                        shared: Boolean(shareId) && !shareHidden,
                    })}
                    ref={saveShareURLRef}
                    onClick={e => {
                        e.target.select();
                    }}
                    onKeyUp={e => {
                        e.target.select();
                    }}
                />

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
                        onToggleFullscreen();
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
                        <i className="fa fa-close" />
                    </a>
                ) : null}
            </div>
        </div>
    );
}
