import React from "react";

import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import BreadcrumbItem from "react-bootstrap/lib/BreadcrumbItem";

export default function PathDisplay({ path, onPopState }) {
    function pathEl(p, index, path) {
        const reverseDepth = path.length - 1 - index;
        if (p.type === "predicate") {
            return (
                <BreadcrumbItem
                    active={reverseDepth === 0}
                    onClick={e => onPopState(reverseDepth)}
                >
                    <i class="fas fa-external-link-alt" />
                    &nbsp;
                    {p.predicate}
                </BreadcrumbItem>
            );
        }
        if (p.type === "nodeProp") {
            return (
                <BreadcrumbItem
                    active={reverseDepth === 0}
                    onClick={e => onPopState(reverseDepth)}
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
