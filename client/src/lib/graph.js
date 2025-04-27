/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

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
    const MAX_LINE = 12;
    let words = String(label)
        .split(/\s/)
        .filter(x => x)
        .join(" ");

    if (words.length > MAX_LINE) {
        words = words.substr(0, MAX_LINE - 3);
        if (words[words.length - 1] === " ") {
            words = words.substr(0, words.length - 1);
        }
        return words + "...";
    }
    return words;
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
    return Object.keys(properties).find((p) => regex.test(p)) || "";
}

export class GraphParser {
    queue = [];

    labeler = new GraphLabeler();
    nodesDataset = new Map();
    edgesDataset = new Map();
    edgeLists = new Map();

    addResponseToQueue(response, expansionNode = "FromResponse") {
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
    }

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
        const FACET_DELIMETER = "|";

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

                const facetSplit = prop.split(FACET_DELIMETER);
                if (facetSplit.length > 1) {
                    const [facetPred, facetKey] = facetSplit;

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

            // Root nodes don't have a source node, so we don't want to create
            // any edge for them.
            if (obj.src.id === "") {
                continue;
            }

            const edgeKey = [obj.src.id, uid, groupProperties.pred]
                .filter(val => val)
                .join("-");

            const oldEdge = this.edgesDataset.get(edgeKey);
            if (oldEdge) {
                Object.assign(oldEdge.facets, edgeFacets);
                return;
            }

            const newEdge = {
                source: obj.src.id,
                target: uid,
                facets: edgeFacets,
                label: groupProperties.pred,
                predicate: groupProperties.pred,
                color: groupProperties.color,
                fromTo: [obj.src.id, uid].filter(val => val).join("-"),
            };
            this.edgesDataset.set(edgeKey, newEdge);

            const list = this.edgeLists.get(newEdge.fromTo);
            if (list) {
                list.push(newEdge);
                list.forEach((edge, idx) => {
                    edge.siblingCount = list.length;
                    edge.siblingIndex = idx;
                });
            } else {
                this.edgeLists.set(newEdge.fromTo, [newEdge]);
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
                const list = this.edgeLists.get(edge.fromTo);
                list.splice(list.indexOf(edge), 1);
                list.forEach((x, i) => {
                    x.siblingIndex = i;
                    x.siblingCount = list.length;
                });
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
