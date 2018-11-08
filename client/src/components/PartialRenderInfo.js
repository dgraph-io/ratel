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
            Only a subset of graph was rendered.{" "}
            <a
                href="#expand"
                onClick={e => {
                    e.preventDefault();
                    onExpandNetwork();
                }}
            >
                Expand remaining {remainingNodes} nodes.
            </a>
        </div>
    );
}
