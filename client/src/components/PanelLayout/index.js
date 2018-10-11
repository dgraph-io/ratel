import React from "react";
import classnames from "classnames";
import Draggable from "react-draggable";

import "./PanelLayout.scss";

export default class PanelLayout extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isVertical: !!this.props.disableHorizontal,
            position: null,
            width: -1,
            height: -1,
        };

        this.body = React.createRef();
        this.second = React.createRef();
    }

    // TODO: implementation detail leaked into parent but how else... ¯\_(ツ)_/¯
    scrollSecondToTop = () => {
        this.second.current.scrollTop = 0;
    };

    componentDidMount() {
        window.addEventListener("resize", this._handleWindowResize);
    }

    componentDidUpdate() {
        this._onResize();
    }

    _handleDrag = (e, ui) => {
        this.setState({
            position: this.state.position + ui.deltaX,
        });
    };

    _handleDragStart = (e, ui) => {
        this.setState({
            separatorPosition: this.state.position,
        });
    };

    _handleDragStop = (e, ui) => {
        this.setState(
            {
                separatorPosition: null,
            },
            () => this.props.onAfterResize && this.props.onAfterResize(),
        );
    };

    _onResize = () => {
        const { offsetWidth, offsetHeight } = this.body.current;
        // Only setState when dimensions actually changed to avoid infinite loop
        if (
            offsetWidth !== this.state.width ||
            offsetHeight !== this.state.height
        ) {
            setTimeout(
                () =>
                    this.setState({
                        height: offsetHeight,
                        width: offsetWidth,
                    }),
                0,
            );
        }
    };

    componentWillUnmount() {
        window.removeEventListener("resize", this._handleWindowResize);
    }

    _handleWindowResize = e => {
        this._onResize();
    };

    getPanelStyles() {
        const { isVertical, width, position } = this.state;
        if (!isVertical || width <= 0) {
            return {};
        }

        // Vertical layout
        let pos =
            position === null
                ? (this.props.defaultRatio || 0.382) * width
                : position;
        if (pos >= width - 50) {
            pos = Math.max(width / 2, width - 50);
        }

        if (pos < 50) {
            pos = Math.min(width / 2, 50);
        }

        pos = Math.round(pos);
        if (pos !== position) {
            setTimeout(() => this.setState({ position: pos }), 0);
        }

        return {
            first: {
                width: `${pos}px`,
            },
            second: {
                flex: 1,
            },
            separator: {
                left: `${this.state.separatorPosition || pos}px`,
            },
        };
    }

    render() {
        const { disableHorizontal, first, second } = this.props;
        const { isVertical } = this.state;

        const styles = this.getPanelStyles();

        return (
            <div
                className={classnames("panel-layout", {
                    cols: isVertical,
                    rows: !isVertical,
                    "no-toolbar": disableHorizontal,
                })}
                ref={this.body}
            >
                {!disableHorizontal ? (
                    <div className="toolbar">
                        <button
                            className={isVertical ? "active" : ""}
                            onClick={() => this.setState({ isVertical: true })}
                        >
                            <i className="fas fa-columns" />
                        </button>
                        <button
                            className={!isVertical ? "active" : ""}
                            onClick={() => this.setState({ isVertical: false })}
                        >
                            <i className="fas fa-columns fa-rotate-270" />
                        </button>
                    </div>
                ) : null}
                <div className="panel first" style={styles.first}>
                    {first}
                </div>

                {isVertical ? (
                    <Draggable
                        axis={isVertical ? "x" : "y"}
                        bound="parent"
                        onDrag={this._handleDrag}
                        onStart={this._handleDragStart}
                        onStop={this._handleDragStop}
                        position={{ x: 0, y: 0 }}
                    >
                        <div className="separator" style={styles.separator} />
                    </Draggable>
                ) : null}
                <div
                    className="panel second"
                    ref={this.second}
                    style={styles.second}
                >
                    {second}
                </div>
            </div>
        );
    }
}
