// Copyright 2017-2021 Dgraph Labs, Inc. and Contributors
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
import Button from "react-bootstrap/Button";
import classnames from "classnames";

import Label from "./Label";

import "assets/css/EntitySelector.scss";

export default class EntitySelector extends React.Component {
    state = { expanded: false };

    render() {
        const { graphLabels, onPredicateHovered } = this.props;
        const { expanded } = this.state;

        return (
            <div className={classnames("entity-selector", { expanded })}>
                <Button
                    className="toggle"
                    onClick={() => this.setState({ expanded: !expanded })}
                >
                    &#x25B2;
                </Button>
                {graphLabels.map(label => (
                    <Label
                        key={label.pred}
                        color={label.color}
                        pred={label.pred}
                        label={label.label}
                        onMouseEnter={() => onPredicateHovered(label.pred)}
                        onMouseLeave={() => onPredicateHovered()}
                    />
                ))}
            </div>
        );
    }
}
