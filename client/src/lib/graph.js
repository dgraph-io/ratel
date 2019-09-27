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

import cloneDeep from "lodash.clonedeep";
import uuid from "uuid";

import GraphLabeler from "./GraphLabeler";

export const FIRST_RENDER_LIMIT = 400;

function aggregationPrefix(properties) {
    let aggTerms = ["count(", "max(", "min(", "sum("];
    for (const k in Object.keys(properties)) {
        if (k === "count") {
            return ["count", "count"];
        }
        for (const term of aggTerms) {
            if (k.startsWith(term)) {
                return [term.substr(0, term.length - 1), k];
            }
        }
    }
    return ["", ""];
}

export function shortenName(label) {
    label = String(label);
    let words = label.split(" "),
        firstWord = words[0];
    if (firstWord.length > 20) {
        label = [firstWord.substr(0, 9), firstWord.substr(9, 7) + "..."].join(
            "-\n",
        );
    } else if (firstWord.length > 10) {
        label = [firstWord.substr(0, 9), firstWord.substr(9)].join("-\n");
    } else {
        // First word is less than 10 chars so we can display it in full.
        if (words.length > 1) {
            if (words[1].length > 10) {
                label = [firstWord, words[1].substr(0, 7) + "..."].join("\n");
            } else {
                label = [firstWord, words[1]].join("\n");
            }
        } else {
            label = firstWord;
        }
    }

    return label;
}

export function getNodeLabel(properties, regex) {
    let label = "";
    let keys = Object.keys(properties);
    if (keys.length === 1) {
        label = aggregationPrefix(properties)[0];
        if (label !== "") {
            return label;
        }
    }

    let nameKey = getNameKey(properties, regex);
    let val = properties[nameKey];
    if (Array.isArray(val) && val.length > 0) {
        return val[0];
    }
    return val || "";
}

function getNameKey(properties, regex) {
    return Object.keys(properties).find(p => regex.test(p)) || "";
}

export class GraphParser {
    queue = [];

    labeler = new GraphLabeler();
    nodesDataset = new Map();
    edgesDataset = new Map();

    addResponseToQueue = (response, expansionNode = "FromResponse") => {
        response = cloneDeep(response);

        Object.entries(response).forEach(([key, block]) =>
            block.forEach(node =>
                this.queue.push({
                    node,
                    src: {
                        id: "",
                        pred: key,
                        expansionNode,
                    },
                }),
            ),
        );
    };

    nameNode(nodeAttrs, regexStr) {
        // aggrTerm can be count, min or max. aggrPred is the actual predicate returned.
        const [aggrTerm, aggrPred] = aggregationPrefix(nodeAttrs);

        if (aggrTerm !== "") {
            return {
                displayLabel: nodeAttrs[aggrPred],
                fullName: "",
            };
        } else {
            const fullName = regexStr
                ? getNodeLabel(nodeAttrs, new RegExp(regexStr, "i"))
                : "";
            return {
                displayLabel: shortenName(fullName),
                fullName,
            };
        }
    }

    processQueue = (regexStr = null, maxAdd = FIRST_RENDER_LIMIT) => {
        let processedNodeCount = 0;
        const facetDelimeter = "|";

        while (this.queue.length > 0) {
            if (processedNodeCount >= maxAdd) {
                // Break now, with more nodes still in queue.
                return;
            }
            processedNodeCount++;

            const obj = this.queue.shift();

            const properties = {
                    attrs: {},
                    facets: {},
                },
                edgeFacets = {};

            // Some nodes like results of aggregation queries, max , min, count etc don't have a
            // uid, so we need to assign thme one.
            const uid = obj.node.uid || uuid();

            for (let prop of Object.keys(obj.node).sort()) {
                // We can have a key-val pair, another array or an object here (in case of facets).
                const val = obj.node[prop];

                const delimIdx = prop.indexOf(facetDelimeter);
                if (delimIdx >= 0) {
                    const facetPred = prop.substr(0, delimIdx);
                    const facetKey = prop.substr(delimIdx + 1);
                    if (facetPred === obj.src.pred) {
                        edgeFacets[facetKey] = val;
                    } else {
                        properties.facets[`${facetPred}[${facetKey}]`] = val;
                    }
                } else if (
                    Array.isArray(val) &&
                    val.length > 0 &&
                    typeof val[0] === "object"
                ) {
                    // These are child nodes, lets add them to the queue.
                    val.map(x =>
                        this.queue.push({
                            node: x,
                            src: {
                                pred: prop,
                                id: uid,
                                expansionNode: obj.src.expansionNode,
                            },
                        }),
                    );
                } else if (
                    typeof val === "object" &&
                    val &&
                    typeof val.uid === "string"
                ) {
                    // This is a one to one relationship in v1.1.
                    this.queue.push({
                        node: val,
                        src: {
                            pred: prop,
                            id: uid,
                            expansionNode: obj.src.expansionNode,
                        },
                    });
                } else {
                    properties.attrs[prop] = val;
                }
            }

            const { displayLabel, fullName } = this.nameNode(
                properties.attrs,
                regexStr,
            );
            const groupProperties = this.labeler.getGroupProperties(
                obj.src.pred,
            );

            let n = {
                id: uid,
                uid: obj.node.uid,
                // For aggregation nodes, label is the actual value, for other nodes its
                // the value of name.
                label: displayLabel,
                properties: properties,
                color: groupProperties.color,
                group: obj.src.pred,
                name: fullName,
                expansionParents: new Set([obj.src.expansionNode]),
            };

            const node = this.nodesDataset.get(uid);
            if (!node) {
                this.nodesDataset.set(uid, n);
            } else {
                // Merge new properties into the existing node.
                node.properties = Object.assign(
                    {},
                    n.properties,
                    node.properties,
                );
                node.color = node.color || n.color;
                node.label = node.label || n.label || "";
                node.name = node.name || n.name || "";

                node.expansionParents.add(obj.src.expansionNode);
                if (node.uid === obj.src.expansionNode) {
                    node.expanded = true;
                }
            }

            // Root nodes don't have a source node, so we don't want to create any edge for them.
            if (obj.src.id === "") {
                continue;
            }

            const fromTo = [obj.src.id, uid].filter(val => val).join("-");

            const oldEdge = this.edgesDataset.get(fromTo);
            if (oldEdge) {
                Object.assign(oldEdge.facets, edgeFacets);
            } else {
                this.edgesDataset.set(fromTo, {
                    source: obj.src.id,
                    target: uid,
                    facets: edgeFacets,
                    label: groupProperties.label,
                    predicate: groupProperties.pred,
                    color: groupProperties.color,
                });
            }
        }
    };

    // Removes all nodes and edges that were added when expanding the expansionNode
    collapseNode = expansionUid => {
        this.queue = this.queue.filter(
            el => el.src.expansionNode !== expansionUid,
        );

        const uidsToRemove = new Set();
        this.nodesDataset.forEach(node => {
            if (node.uid === expansionUid) {
                node.expanded = false;
            }
            node.expansionParents.delete(expansionUid);
            if (node.expansionParents.size === 0) {
                uidsToRemove.add(node.uid);
            }
        });

        this.edgesDataset.forEach((edge, key) => {
            if (
                uidsToRemove.has(edge.source.uid) ||
                uidsToRemove.has(edge.target.uid)
            ) {
                this.edgesDataset.delete(key);
            }
        });
        uidsToRemove.forEach(uid => this.nodesDataset.delete(uid));
    };

    getCurrentGraph = () => {
        return {
            nodes: this.nodesDataset,
            edges: this.edgesDataset,
            remainingNodes: this.queue.length,
            labels: this.labeler.getAxisPlot(),
        };
    };
}
