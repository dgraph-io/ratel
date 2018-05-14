import React from "react";

import Highlight from "./Highlight";

export default function FrameCodeTab({ query, response }) {
    return (
        <div className="content-container">
            <div className="code-container">
                <Highlight preClass="content">
                    {JSON.stringify(response, null, 2)}
                </Highlight>
            </div>
        </div>
    );
}
