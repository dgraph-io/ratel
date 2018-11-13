import React from "react";

export default function PartialRenderInfo({
    canExpand,
    remainingNodes,
    onExpandNetwork,
}) {
    if (!canExpand) {
        return null;
    }
    return (
        <div className="partial-render-info">
            Only a subset of the graph was rendered.
            <button
                className="btn btn-link"
                style={{ verticalAlign: "baseline" }}
                onClick={onExpandNetwork}
            >
                Expand remaining {remainingNodes} nodes.
            </button>
        </div>
    );
}
