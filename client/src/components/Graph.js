import React from "react";

import "../assets/css/Graph.scss";

class Graph extends React.Component {
    render() {
        return (
            <div className="Graph-wrapper">
                <div className="Graph-outer">
                    <div id="graph" />
                </div>
            </div>
        );
    }
}

export default Graph;
