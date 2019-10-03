// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
            activeFrameId,
            frames,
            onDiscardFrame,
            onSelectQuery,
            queryTimeout,
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
                        activeFrameId={activeFrameId}
                        frame={frame}
                        collapsed={true}
                        onDiscardFrame={onDiscardFrame}
                        onSelectQuery={onSelectQuery}
                        queryTimeout={queryTimeout}
                        url={url}
                    />
                ))}
                {loadMoreButton}
            </div>
        );
    }
}
