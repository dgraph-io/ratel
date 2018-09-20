import React from "react";
import classnames from "classnames";

import NodeProperties from "../components/NodeProperties";
import PartialRenderInfo from "../components/PartialRenderInfo";
import Progress from "../components/Progress";

import { renderNetwork } from "../lib/graph";

import "../assets/css/Graph.scss";

import "vis/dist/vis.min.css";

const doubleClickTime = 0;
const threshold = 200;

class GraphContainer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            renderProgress: 0,
        };
    }

    componentDidMount() {
        const {
            treeView,
            onBeforeRender,
            onRendered,
            nodesDataset,
            edgesDataset,
        } = this.props;

        onBeforeRender();

        const { network } = renderNetwork({
            nodes: nodesDataset,
            edges: edgesDataset,
            containerEl: this.refs.graph,
            treeView,
        });

        // In tree view, physics is disabled and stabilizationIterationDone is not fired.
        if (treeView) {
            this.setState({ renderProgress: 100 }, () => {
                onRendered();
                // FIXME: tree does not fit because when it is rendered at the initial render, it is not visible
                // maybe lazy render.
                network.fit();
            });
        }

        this.configNetwork(network);

        this.setState({ network }, () => {
            window.addEventListener("resize", this.fitNetwork);
        });

        if (this.props.restoreSelectionOnLoad) {
            network.selectNodes([this.props.restoreSelectionOnLoad]);
            // network.setSelection does not fire events. Trigger them manually.
            const selectedNodes = network.getSelectedNodes();
            if (selectedNodes.length) {
                const node = network.body.data.nodes.get(selectedNodes[0]);
                this.props.onNodeSelected(node);
            }
        }

        // FIXME: hacky workaround for zoom problem: https://github.com/almende/vis/issues/3021.
        const els = document.getElementsByClassName("vis-network");
        for (let i = 0; i < els.length; i++) {
            els[i].style.width = null;
        }
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.fitNetwork);
    }

    // fitNetwork update the fit of the network.
    fitNetwork = () => {
        const { network } = this.state;

        if (network) {
            network.fit();
        }
    };

    // configNetwork configures the custom behaviors for a a network.
    configNetwork = network => {
        const { onNodeHovered, onNodeSelected } = this.props;
        const { data } = network.body;

        network.on("stabilizationProgress", params => {
            const widthFactor = params.iterations / params.total;

            this.setState({
                renderProgress: widthFactor * 100,
            });
        });

        network.once("stabilizationIterationsDone", () => {
            const { onRendered } = this.props;
            this.setState({ renderProgress: 100 }, () => {
                network.fit();
                onRendered();
            });
        });

        network.on("click", params => {
            const t0 = new Date();

            if (t0 - doubleClickTime > threshold) {
                setTimeout(() => {
                    if (t0 - doubleClickTime < threshold) {
                        return;
                    }

                    if (params.nodes.length > 0) {
                        const nodeUid = params.nodes[0];
                        const clickedNode = data.nodes.get(nodeUid);

                        onNodeSelected(clickedNode);
                    } else if (params.edges.length > 0) {
                        const edgeUid = params.edges[0];
                        const currentEdge = data.edges.get(edgeUid);

                        onNodeSelected(currentEdge);
                    } else {
                        onNodeSelected(null);
                    }
                }, threshold);
            }
        });

        network.on("doubleClick", params => {
            if (params.nodes && params.nodes.length > 0) {
                const clickedNodeUid = params.nodes[0];
                const clickedNode = data.nodes.get(clickedNodeUid);

                network.unselectAll();
                onNodeSelected(clickedNode);
                this.props.onExpandNode(clickedNode.uid);
            }
        });

        network.on("hoverNode", params => {
            const nodeUID = params.node;
            const currentNode = data.nodes.get(nodeUID);

            onNodeHovered(currentNode);
        });

        network.on("blurNode", params => {
            onNodeHovered(null);
        });

        network.on("hoverEdge", params => {
            const edgeUID = params.edge;
            const currentEdge = data.edges.get(edgeUID);

            onNodeHovered(currentEdge);
        });

        network.on("blurEdge", params => {
            onNodeHovered(null);
        });

        network.on("dragEnd", params => {
            for (let i = 0; i < params.nodes.length; i++) {
                let nodeId = params.nodes[i];
                data.nodes.update({ id: nodeId, fixed: { x: true, y: true } });
            }
        });

        network.on("dragStart", params => {
            for (let i = 0; i < params.nodes.length; i++) {
                let nodeId = params.nodes[i];
                data.nodes.update({
                    id: nodeId,
                    fixed: { x: false, y: false },
                });
            }
        });
    };

    render() {
        const { onExpandNode, onExpandResponse, parsedResponse } = this.props;
        const { renderProgress } = this.state;

        const isRendering = renderProgress !== 100;
        const canToggleExpand = parsedResponse.remainingNodes > 0;

        return (
            <div className="graph-container">
                {!isRendering && canToggleExpand ? (
                    <PartialRenderInfo
                        canExpand={canToggleExpand}
                        remainingNodes={parsedResponse.remainingNodes}
                        onExpandNetwork={onExpandResponse}
                    />
                ) : null}
                {isRendering ? <Progress perc={renderProgress} /> : null}
                <div
                    ref="graph"
                    className={classnames("graph", { hidden: isRendering })}
                />
                {this.props.selectedNode ? (
                    <NodeProperties
                        node={this.props.selectedNode}
                        onExpandNode={onExpandNode}
                    />
                ) : null}
            </div>
        );
    }
}

export default GraphContainer;
