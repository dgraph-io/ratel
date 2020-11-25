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

import ColorGenerator from "./ColorGenerator";

export default class GraphLabeler {
    groupProperties = {};
    // Contains map of a lable to its shortform.
    shortLabelExists = {};

    colorGenerator = new ColorGenerator();

    // This function shortens and calculates the label for a predicate.
    getGroupProperties = pred => {
        if (this.groupProperties[pred]) {
            // We have already calculated the label for this predicate.
            return this.groupProperties[pred];
        }

        const char0 = "0".charCodeAt(0),
            char9 = "9".charCodeAt(0);

        const isDigit = c =>
            c.charCodeAt(0) >= char0 && c.charCodeAt(0) <= char9;
        const isLetter = c => c.toUpperCase() !== c.toLowerCase();

        let prefix = pred;
        let suffix = "";

        // TODO: add support for more than one dot.
        const dotIdx = pred.indexOf(".");
        if (dotIdx > 0 && dotIdx !== pred.length - 1) {
            // Predicate is at least two dot separated parts.
            prefix = pred.substr(0, dotIdx);
            suffix = pred
                .substr(dotIdx + 1)
                .split("")
                .filter(c => isLetter(c) || isDigit(c))
                .join("");
        }

        // if first character is ~ or whatever - label must be at least 2 chars.
        const minPrefix = prefix.length && !isLetter(prefix[0]) ? 2 : 1;
        const minSuffix = suffix.length ? 1 : 0;

        for (let len = 0; len <= prefix.length + suffix.length; len++) {
            let res = this.tryAllocateShortLabel(
                prefix.substr(0, minPrefix + len) +
                    suffix.substr(0, minSuffix + len),
                pred,
            );
            if (res) {
                return res;
            }

            // Try a prefix of one character longer. This way we try longer prefix followed by prefix and suffix of same length.
            res = this.tryAllocateShortLabel(
                prefix.substr(0, minPrefix + len + 1) +
                    suffix.substr(0, minSuffix + len),
                pred,
            );
            if (res) {
                return res;
            }
        }
        // No shorter string has been found. Give up and use whole predicate.
        return this.tryAllocateShortLabel(pred, pred);
    };

    tryAllocateShortLabel = (label, pred) => {
        if (this.shortLabelExists[label]) {
            // This label already exists. Don't allocate anything.
            return null;
        }

        this.shortLabelExists[label] = true;
        return (this.groupProperties[pred] = {
            label: label,
            pred,
            color: this.colorGenerator.get(),
        });
    };

    getAxisPlot = () => Object.values(this.groupProperties);
}
