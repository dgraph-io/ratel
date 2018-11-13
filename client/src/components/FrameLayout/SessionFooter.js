import React from "react";

import SessionFooterResult from "./SessionFooterResult";
import SessionFooterProperties from "./SessionFooterProperties";

export default function SessionFooter({
    response,
    currentTab,
    hoveredNode,
    selectedNode,
}) {
    return (
        <div className="footer">
            {selectedNode || hoveredNode ? (
                <SessionFooterProperties entity={selectedNode || hoveredNode} />
            ) : (
                <SessionFooterResult
                    currentTab={currentTab}
                    response={response}
                />
            )}
        </div>
    );
}
