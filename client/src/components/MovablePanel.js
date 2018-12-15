import React from "react";
import Draggable from "react-draggable";

const MIN_WIDTH = 150;
const MIN_HEIGHT = 80;

const MIN_GAP_WIDTH = 100;
const MIN_GAP_HEIGHT = 25;

export default class NodeProperties extends React.Component {
    state = {
        width: MIN_WIDTH,
        height: MIN_HEIGHT,
    };

    _onDrag = e => {
        let { width, height } = this.state;
        width -= e.movementX;
        height -= e.movementY;
        this.setState(this.getBoundSize({ width, height }));
    };

    getBoundSize = ({ width, height } = this.state) => {
        width = width || this.state.width;
        height = height || this.state.height;

        const { boundingSelector } = this.props;
        const el = document.querySelector(boundingSelector);
        if (!el) {
            return { width, height };
        }
        const maxW = el.clientWidth - MIN_GAP_WIDTH;
        const maxH = el.clientHeight - MIN_GAP_HEIGHT;

        return {
            width: Math.max(MIN_WIDTH, Math.min(width, maxW)),
            height: Math.max(MIN_HEIGHT, Math.min(height, maxH)),
        };
    };

    render() {
        const { width, height } = this.getBoundSize();

        return (
            <div className="graph-overlay" style={{ width, height }}>
                <Draggable
                    onDrag={this._onDrag}
                    bounds=".graph-container"
                    position={{ x: 0, y: 0 }}
                >
                    <div className="resize-handle">
                        <i className="fas fa-arrows-alt" />
                    </div>
                </Draggable>
                <div
                    className="tools-placeholder"
                    style={{
                        float: "left",
                        height: 24,
                        width: 24,
                    }}
                />
                {this.props.children}
            </div>
        );
    }
}
