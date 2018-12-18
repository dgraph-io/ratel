// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import Button from "react-bootstrap/lib/Button";
import classnames from "classnames";

import Label from "./Label";

import "assets/css/EntitySelector.scss";

export default class EntitySelector extends React.Component {
    state = { expanded: false };

    render() {
        const { response, onAxisHovered } = this.props;
        const { expanded } = this.state;

        return (
            <div className={classnames("entity-selector", { expanded })}>
                <Button
                    className="toggle"
                    onClick={() => this.setState({ expanded: !expanded })}
                >
                    &#x25B2;
                </Button>
                {response.plotAxis.map(label => (
                    <Label
                        key={label.pred}
                        color={label.color}
                        pred={label.pred}
                        label={label.label}
                        onMouseEnter={() => onAxisHovered(label.pred)}
                        onMouseLeave={() => onAxisHovered()}
                    />
                ))}
            </div>
        );
    }
}
