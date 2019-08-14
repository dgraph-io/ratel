// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

import Breadcrumb from "react-bootstrap/Breadcrumb";
import BreadcrumbItem from "react-bootstrap/BreadcrumbItem";

export default function PathDisplay({ path, onPopState }) {
    function pathEl(p, index, path) {
        const reverseDepth = path.length - 1 - index;
        if (p.type === "predicate") {
            return (
                <BreadcrumbItem
                    key={JSON.stringify(p)}
                    active={reverseDepth === 0}
                    onClick={e =>
                        reverseDepth > 0 ? onPopState(reverseDepth) : null
                    }
                >
                    <i className="fas fa-external-link-alt" />
                    &nbsp;
                    {p.predicate}
                </BreadcrumbItem>
            );
        }
        if (p.type === "nodeProp") {
            return (
                <BreadcrumbItem
                    key={JSON.stringify(p)}
                    active={reverseDepth === 0}
                    onClick={e =>
                        reverseDepth > 0 ? onPopState(reverseDepth) : null
                    }
                >
                    uid:&nbsp;
                    {p.uid}
                    &nbsp;
                    <b>.</b>
                    &nbsp;
                    {p.prop}
                </BreadcrumbItem>
            );
        }
    }

    return <Breadcrumb>{path.map(pathEl)}</Breadcrumb>;
}
