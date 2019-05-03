// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

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

    squashFrame(frames, frame, results) {
        if (!frames.length) {
            return results;
        }

        const { query } = frame;
        const neighbor = results[results.length - 1];
        if (neighbor && neighbor.query === query) {
            neighbor.history.push(frame);
        } else {
            results.push({
                query,
                history: [frame],
            });
        }

        return this.squashFrame(
            frames.slice(1, frames.length),
            frames[0],
            results,
        );
    }

    render() {
        const {
            squashFrames,
            activeFrameId,
            frames,
            onDiscardFrame,
            onSelectQuery,
            onUpdateConnectedState,
            patchFrame,
            queryTimeout,
            url,
        } = this.props;
        const { count } = this.state;

        let finalFrames = squashFrames
            ? this.squashFrame(frames.slice(1, frames.length), frames[0], [])
            : frames;

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
                        key={squashFrames ? frame.history[0].id : frame.id}
                        activeFrameId={activeFrameId}
                        frame={squashFrames ? frame.history[0] : frame}
                        collapsed={true}
                        onDiscardFrame={onDiscardFrame}
                        onSelectQuery={onSelectQuery}
                        onUpdateConnectedState={onUpdateConnectedState}
                        patchFrame={patchFrame}
                        queryTimeout={queryTimeout}
                        url={url}
                    />
                ))}
                {loadMoreButton}
            </div>
        );
    }
}
