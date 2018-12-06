import React from "react";

import Label from "./Label";

import "assets/css/EntitySelector.scss";

export default function EntitySelector({
    response,
    onAxisHovered,
    onUpdateLabelRegex,
    labelRegexStr,
    onUpdateLabels,
}) {
    return (
        <div className="entity-selector">
            {response.plotAxis.map((label, i) => (
                <Label
                    key={i}
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
