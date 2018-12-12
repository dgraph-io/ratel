import React from "react";

import SessionFooterResult from "./SessionFooterResult";
import SessionFooterProperties from "./SessionFooterProperties";

// TODO: this component isn't used at the moment. Maybe delete.

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
