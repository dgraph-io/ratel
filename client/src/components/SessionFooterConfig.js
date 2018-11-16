import React from "react";

// TODO: Implement customization for label based on nodetype not global regex.
export default function SessionFooterConfig() {
    return (
        <div>
            <input
                type="text"
                placeholder="Enter regex to customize node labels"
            />
        </div>
    );
}
