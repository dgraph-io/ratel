// Graph helpers

import vis from "vis";
import _ from "lodash";
import uuid from "uuid";
import randomColor from "randomcolor";

function findAndMerge(nodes, n) {
    let properties = n.properties,
        uid = properties.attrs.uid,
        node = nodes.get(uid);

    if (!node) {
        console.warn("Expected to find node with uid: ", uid);
        return;
    }

    _.merge(node.properties, n.properties);
    // For shortest path, this would overwrite the color and this is fine
    // because actual shortes path is traversed later.
    node.color = n.color;

    if (node.label === "") {
        node.label = n.label;
    }
    if (node.name === "" && n.name !== "") {
        node.name = n.name;
    }
}

function aggregationPrefix(properties) {
    let aggTerms = ["count(", "max(", "min(", "sum("];
    for (let k in properties) {
        if (!properties.hasOwnProperty(k)) {
            continue;
        }
        if (k === "count") {
            return ["count", "count"];
        }
        for (let term of aggTerms) {
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
    for (let i in properties) {
        if (!properties.hasOwnProperty(i)) {
            continue;
        }
        if (regex.test(i)) {
            return i;
        }
    }
    return "";
}

// This function shortens and calculates the label for a predicate.
function getGroupProperties(pred, edgeLabels, groups, randomColors) {
    const prop = groups[pred];
    if (prop !== undefined) {
        // We have already calculated the label for this predicate.
        return prop;
    }

    let l;
    let dotIdx = pred.indexOf(".");
    if (dotIdx !== -1 && dotIdx !== 0 && dotIdx !== pred.length - 1) {
        l = pred[0] + pred[dotIdx + 1];
        checkAndAssign(groups, pred, l, edgeLabels, randomColors);
        return groups[pred];
    }

    for (let i = 1; i <= pred.length; i++) {
        l = pred.substr(0, i);
        // If the first character is not an alphabet we just continue.
        // This saves us from selecting ~ in case of reverse indexed preds.
        if (l.length === 1 && l.toLowerCase() === l.toUpperCase()) {
            continue;
        }
        if (edgeLabels[l] === undefined) {
            checkAndAssign(groups, pred, l, edgeLabels, randomColors);
            return groups[pred];
        }
        // If it has already been allocated, then we increase the substring length and look again.
    }

    groups[pred] = {
        label: pred,
        color: getRandomColor(randomColors),
    };
    edgeLabels[pred] = true;
    return groups[pred];
}

function createAxisPlot(groups) {
    let axisPlot = [];
    for (let pred in groups) {
        if (!groups.hasOwnProperty(pred)) {
            continue;
        }

        axisPlot.push({
            label: groups[pred]["label"],
            pred: pred,
            color: groups[pred]["color"],
        });
    }

    return axisPlot;
}

// TODO: Needs some refactoring. Too many arguments are passed.
function checkAndAssign(groups, pred, l, edgeLabels, randomColors) {
    // This label hasn't been allocated yet.
    groups[pred] = {
        label: l,
        color: getRandomColor(randomColors),
    };
    edgeLabels[l] = true;
}

function getRandomColor(randomColors) {
    if (randomColors.length === 0) {
        return randomColor();
    }

    let color = randomColors[0];
    randomColors.splice(0, 1);
    return color;
}

/**
 * renderNetwork renders a vis.Network within the containerEl
 * nodes {vis.DataSet}
 * edges {vis.DataSet}
 * containerEl {HTMLElement}
 */
export function renderNetwork({
    nodes,
    edges,
    treeView,
    allNodes,
    allEdges,
    containerEl,
}) {
    const data = {
        nodes,
        edges,
    };
    const options = {
        nodes: {
            shape: "circle",
            scaling: {
                max: 20,
                min: 20,
                label: {
                    enabled: true,
                    min: 14,
                    max: 14,
                },
            },
            font: {
                size: 16,
            },
            margin: {
                top: 25,
            },
        },
        height: "100%",
        width: "100%",
        interaction: {
            hover: true,
            keyboard: {
                enabled: true,
                bindToWindow: false,
            },
            navigationButtons: true,
            tooltipDelay: 1000000,
            hideEdgesOnDrag: true,
            zoomView: false,
        },
        layout: {
            randomSeed: 42,
            improvedLayout: false,
        },
        physics: {
            stabilization: {
                fit: true,
                updateInterval: 5,
                iterations: 20,
            },
            barnesHut: {
                damping: 0.7,
            },
        },
    };

    if (data.nodes.length < 100) {
        _.merge(options, {
            physics: {
                stabilization: {
                    iterations: 200,
                    updateInterval: 50,
                },
            },
        });
    }

    if (treeView) {
        options.layout = {
            hierarchical: {
                sortMethod: "directed",
            },
        };
        options.physics = {
            // Otherwise there is jittery movement (existing nodes move
            // horizontally which doesn't look good) when you expand some
            // nodes.
            enabled: false,
            barnesHut: {},
        };
    }

    const network = new vis.Network(containerEl, data, options);
    return { network };
}

export class GraphParser {
    constructor() {
        this.queue = [];

        // Contains map of a lable to its shortform thats displayed.
        this.predLabel = {};
        // Map of whether a Node with an Uid has already been created. This helps
        // us avoid creating duplicating nodes while parsing the JSON structure
        // which is a tree.
        this.uidMap = {};
        this.edgeMap = {};

        this.nodesDataset = new vis.DataSet([]);
        this.edgesDataset = new vis.DataSet([]);

        this.emptyNode = {
            node: {},
            src: {
                id: "",
                pred: "empty",
            },
        };
        // We store the indexes corresponding to what we show at first render here.
        // That we can only do one traversal.
        this.nodesIndex = undefined;
        // Picked up from http://graphicdesign.stackexchange.com/questions/3682/where-can-i-find-a-large-palette-set-of-contrasting-colors-for-coloring-many-d.
        this.randomColorList = [
            "#47c0ee",
            "#8dd593",
            "#f6c4e1",
            "#8595e1",
            "#f0b98d",
            "#f79cd4",
            "#bec1d4",
            "#11c638",
            "#b5bbe3",
            "#7d87b9",
            "#e07b91",
            "#4a6fe3",
        ];
        // Stores the map of a label to boolean (only true values are stored).
        // This helps quickly find if a label has already been assigned.
        this.groups = {};
    }

    addResponseToQueue = response => {
        response = _.cloneDeep(response);

        for (let k in response) {
            // For schema, we should should display all predicates, irrespective of
            // whether they have children or not. Some predicate have tokenizers,
            // are considered as children because it is an array of values.
            let block = response[k];

            for (let i = 0; i < block.length; i++) {
                let rn = {
                    node: block[i],
                    src: {
                        id: "",
                        pred: k,
                    },
                };

                this.queue.push(rn);
            }
        }
        // We push an empty node after all the children.
        // This would help us know when we have traversed all nodes at a level.
        this.queue.push(this.emptyNode);
    };

    processQueue = (treeView, regexStr) => {
        let processedNodeCount = 0;
        const facetDelimeter = "|";
        while (this.queue.length > 0) {
            let obj = this.queue.shift();

            processedNodeCount++;
            if (processedNodeCount > 200) {
                setTimeout(() => this.processQueue(treeView, regexStr), 100);
                return;
            }

            // Check if this is an empty node.
            if (obj === this.emptyNode) {
                // If no more nodes left, then we can break.
                if (this.queue.length === 0) {
                    break;
                }

                this.queue.push(this.emptyNode);
                continue;
            }

            let properties = {
                    attrs: {},
                    facets: {},
                },
                id,
                edgeAttributes = {
                    facets: {},
                },
                uid;

            // Some nodes like results of aggregation queries, max , min, count etc don't have a
            // uid, so we need to assign thme one.
            uid = obj.node.uid || uuid();
            id = treeView
                ? // For tree view, the id is the join of ids of this node
                  // with all its ancestors. That would make it unique.
                  [obj.src.id, uid].filter(val => val).join("-")
                : uid;

            for (let prop of Object.keys(obj.node).sort()) {
                // We can have a key-val pair, another array or an object here (in case of facets).
                let val = obj.node[prop];

                // We get back tokenizer as an array, we usually consider arrays as children. Though
                // in this case tokenizer is a property of the same node and not a child. So we handle
                // it in a special manner.

                const delimIdx = prop.indexOf(facetDelimeter);
                if (delimIdx >= 0) {
                    const facetPred = prop.substr(0, delimIdx);
                    const facetKey = prop.substr(delimIdx + 1);
                    if (facetPred === obj.src.pred) {
                        edgeAttributes.facets[facetKey] = val;
                    } else {
                        properties.facets[`${facetPred}[${facetKey}]`] = val;
                    }
                } else if (
                    Array.isArray(val) &&
                    val.length > 0 &&
                    typeof val[0] === "object"
                ) {
                    // These are child nodes, lets add them to the queue.
                    let arr = val,
                        xposition = 1;
                    for (let j = 0; j < arr.length; j++) {
                        // X position makes sure that nodes are rendered in the order they are received
                        // in the response.
                        arr[j].x = xposition++;
                        this.queue.push({
                            node: arr[j],
                            src: {
                                pred: prop,
                                id: id,
                            },
                        });
                    }
                } else {
                    properties.attrs[prop] = val;
                }
            }

            let nodeAttrs = properties.attrs,
                // aggrTerm can be count, min or max. aggrPred is the actual predicate returned.
                [aggrTerm, aggrPred] = aggregationPrefix(nodeAttrs),
                name = aggrTerm !== "" ? aggrTerm : obj.src.pred,
                props = getGroupProperties(
                    name,
                    this.predLabel,
                    this.groups,
                    this.randomColorList,
                ),
                x = nodeAttrs["x"];

            delete nodeAttrs["x"];

            let displayLabel, fullName;
            if (aggrTerm !== "") {
                displayLabel = nodeAttrs[aggrPred];
            } else {
                fullName = regexStr
                    ? getNodeLabel(nodeAttrs, new RegExp(regexStr, "i"))
                    : "";
                displayLabel = shortenName(fullName);
            }

            let n = {
                id: id,
                uid: obj.node["uid"],
                x: x,
                // For aggregation nodes, label is the actual value, for other nodes its
                // the value of name.
                label: displayLabel,
                // TODO: rename .properties to .properties
                properties: properties,
                color: props.color,
                group: obj.src.pred,
                name: fullName,
            };

            if (this.uidMap[id] === undefined) {
                // For tree view, we can't push duplicates because two query blocks might have the
                // same root node and child elements won't really have the same uids as their uid is a
                // combination of all their ancestor uids.
                this.uidMap[id] = true;
                this.nodesDataset.add(n);
            } else {
                // We have already put this node. So we need to find the node in nodes,
                // merge new properties and put it back.
                findAndMerge(this.nodesDataset, n);
            }

            // Render only first 1000 nodes on first load otherwise graph can get stuck.
            if (
                this.nodesDataset.length > 1000 &&
                this.nodesIndex === undefined
            ) {
                this.nodesIndex = this.nodesDataset.length;
            }

            // Root nodes don't have a source node, so we don't want to create any edge for them.
            if (obj.src.id === "") {
                continue;
            }

            let fromTo = [obj.src.id, id].filter(val => val).join("-");

            if (this.edgeMap[fromTo]) {
                const oldEdge = this.edgesDataset.get(fromTo);
                if (!oldEdge) {
                    continue;
                }

                // This is helpful in case of shortest path results so that we can get
                // the edge weights.
                _.merge(edgeAttributes, oldEdge.properties);
                oldEdge.properties = edgeAttributes;
            } else {
                this.edgeMap[fromTo] = true;

                const e = {
                    from: obj.src.id,
                    to: id,
                    properties: edgeAttributes,
                    label: props.label,
                    color: {
                        color: props.color,
                        highlight: props.color,
                        hover: props.color,
                        inherit: false,
                    },
                    arrows: "to",
                };
                this.edgesDataset.add(e);
            }
        }
    };

    getCurrentGraph = () => {
        stringifyTitles(this.nodesDataset);
        stringifyTitles(this.edgesDataset);

        return {
            nodes: this.nodesDataset,
            edges: this.edgesDataset,
            labels: createAxisPlot(this.groups),
            nodesIndex: this.nodesIndex,
        };
    };
}

// processGraph returns graph properties from response.
export function processGraph(response, treeView, regexStr) {
    const parser = new GraphParser();
    parser.addResponseToQueue(response);
    parser.processQueue(treeView, regexStr);
    return parser.getCurrentGraph();
}

function stringifyTitles(nodes) {
    nodes.forEach(n => {
        n = nodes.get(n.id);
        n.title = JSON.stringify(n.properties);
    });
}
