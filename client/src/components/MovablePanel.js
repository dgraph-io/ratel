import React from "react";
import Draggable from "react-draggable";

const MIN_WIDTH = 150;
const MIN_HEIGHT = 80;

const MIN_GAP_WIDTH = 5;
const MIN_GAP_HEIGHT = 5;

export default class NodeProperties extends React.Component {
    _onDrag = e => {
        let { width, height } = this.props;
        width -= e.movementX;
        height -= e.movementY;
        this.props.onResize(this.getBoundSize({ width, height }));
    };

    getBoundSize = ({ width, height } = this.props) => {
        width = width || MIN_WIDTH;
        height = height || MIN_HEIGHT;
        const { boundingSelector } = this.props;
        const el = document.querySelector(boundingSelector);
        if (!el) {
            return { width, height };
        }
        const maxW = el.clientWidth - MIN_GAP_WIDTH;
        const maxH = el.clientHeight - MIN_GAP_HEIGHT;

        const boundSize = {
            width: Math.max(MIN_WIDTH, Math.min(width, maxW)),
            height: Math.max(MIN_HEIGHT, Math.min(height, maxH)),
        };

        if (boundSize.width !== width || boundSize.height !== height) {
            window.setTimeout(() => this.props.onResize(boundSize), 0);
        }

        return boundSize;
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
