import React from "react";

import FrameItem from "./FrameItem";

import "../assets/css/Frames.scss";

export default class FrameList extends React.Component {
    state = {
        count: 10,
    };

    loadMore = () => {
        this.setState(state => ({
            count: state.count + 10,
        }));
    };

    render() {
        const {
            frames,
            onDiscardFrame,
            onSelectQuery,
            onUpdateConnectedState,
            collapseAllFrames,
            patchFrame,
            updateFrame,
            url,
        } = this.props;
        const { count } = this.state;

        let finalFrames = frames;
        let loadMoreButton = null;
        if (frames.length > count) {
            finalFrames = finalFrames.slice(0, count);
            loadMoreButton = (
                <button
                    className="btn btn-default btn-load-more"
                    onClick={this.loadMore}
                    style={{ marginTop: 10 }}
                >
                    Load older queries
                </button>
            );
        }

        return (
            <div className="frame-list-outer">
                {finalFrames.map(frame => (
                    <FrameItem
                        key={frame.id}
                        frame={frame}
                        forceCollapsed={true}
                        onDiscardFrame={onDiscardFrame}
                        onSelectQuery={onSelectQuery}
                        onUpdateConnectedState={onUpdateConnectedState}
                        collapseAllFrames={collapseAllFrames}
                        patchFrame={patchFrame}
                        updateFrame={updateFrame}
                        url={url}
                    />
                ))}
                {loadMoreButton}
            </div>
        );
    }
}
