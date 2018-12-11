import React from "react";
import * as d3 from "d3";
import { event as currentEvent } from "d3-selection"; // Because https://stackoverflow.com/questions/36887428/d3-event-is-null-in-a-reactjs-d3js-component
import debounce from "lodash/debounce";

import "./D3Graph.scss";

const NODE_RADIUS = 9;
const DOUBLE_CLICK_MS = 250;

const fixedPosForce = () => {
    let self = {
        nodes: [],
    };

    const res = function tick(alpha) {
        self.nodes.forEach(n => {
            if (!n._posFixed) {
                return;
            }
            n.x = n._posFixed.x;
            n.y = n._posFixed.y;
        });
    };

    res.initialize = nodes => (self.nodes = nodes);

    res.setNodeCoords = (node, x, y) => {
        node._posFixed = { x, y };
        node.x = x;
        node.y = y;
    };

    return res;
};

export default class D3Graph extends React.Component {
    width = 100;
    height = 100;
    outer = React.createRef();

    devicePixelRatio = window.devicePixelRatio || 1;

    state = {
        selectedNode: null,
        transform: d3.zoomTransform({}),
    };

    document = {
        nodes: [],
        edges: [],
    };

    labelEdge = (context, edge) => {
        if (
            (this.document.edges.length > 40 &&
                this.state.transform.k * this.devicePixelRatio < 1.25) ||
            this.document.edges.length > 200
        ) {
            return;
        }

        const { x: x1, y: y1 } = edge.source;
        const { x: x2, y: y2 } = edge.target;
        const dx = x2 - x1,
            dy = y2 - y1;
        if (Math.sqrt(dx * dx + dy * dy) < 2 * NODE_RADIUS + 50) {
            return;
        }

        const cx = 0.5 * (x1 + x2);
        const cy = 0.5 * (y1 + y2);

        context.font = `12px sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";

        const maxWidth = 50,
            bgPadding = 2;
        const { width } = context.measureText(edge.label);
        context.globalAlpha = 0.5;
        context.fillStyle = "#fff";
        if (width > maxWidth) {
            context.fillRect(
                cx - maxWidth / 2 - bgPadding,
                cy - 6,
                maxWidth + 2 * bgPadding,
                12,
            );
        } else {
            context.fillRect(
                cx - width / 2 - bgPadding,
                cy - 6,
                width + 2 * bgPadding,
                12,
            );
        }
        context.globalAlpha = 1;

        context.fillStyle = edge.color;
        context.fillText(edge.label, cx, cy, maxWidth);
    };

    labelNode = (context, node) => {
        if (
            (this.document.nodes.length > 50 &&
                this.state.transform.k * this.devicePixelRatio < 1.2) ||
            this.document.nodes.length > 500
        ) {
            return;
        }

        const fontSize = 14;
        context.font = `${fontSize}px sans-serif`;
        context.textAlign = "center";
        context.fillText(
            node.label,
            node.x,
            node.y + NODE_RADIUS + fontSize + 2,
            100,
        );
    };

    _drawAll = () => {
        const context = this.canvasContext;
        if (!context) {
            return;
        }

        const { highlightPredicate } = this.props;

        context.save();
        const { devicePixelRatio: dpr } = this;
        context.clearRect(0, 0, this.width * dpr, this.height * dpr);

        context.translate(
            this.state.transform.x * dpr,
            this.state.transform.y * dpr,
        );
        context.scale(
            this.state.transform.k * dpr,
            this.state.transform.k * dpr,
        );

        this.document.edges.forEach(edge => {
            context.beginPath();
            context.moveTo(edge.source.x, edge.source.y);
            context.strokeStyle = edge.color;
            context.lineWidth =
                edge.predicate === highlightPredicate ? 1.5 : 0.5;

            context.lineTo(edge.target.x, edge.target.y);
            context.stroke();

            this.labelEdge(context, edge);
            context.lineWidth = 0.5;
        });

        // Draw the nodes
        this.document.nodes.forEach((d, i) => {
            context.fillStyle = d.color ? d.color : "#ccc";
            context.strokeStyle = "#c63";

            context.beginPath();
            context.arc(d.x, d.y, NODE_RADIUS, 0, 2 * Math.PI, true);
            context.fill();
            context.stroke();

            if (d === this.state.selectedNode) {
                context.lineWidth = 1.5;
                context.beginPath();
                context.arc(d.x, d.y, NODE_RADIUS, 0, 2 * Math.PI, true);
                context.stroke();
                context.lineWidth = 0.5;
            }

            this.labelNode(context, d);
        });

        context.restore();
    };

    drawGraph = debounce(this._drawAll, 5, { leading: true, trailing: true });

    setForces = (width, height) => {
        this.d3simulation
            .alphaTarget(0.1)
            .alphaMin(0.10001)
            .alphaDecay(0.04)
            .velocityDecay(0.09)
            .force(
                "link",
                d3
                    .forceLink()
                    .distance(60)
                    .strength(0.05)
                    .id(d => d.id)
                    .links(this.document.edges),
            )
            .force("center", d3.forceCenter(0, 0))
            .force("x", d3.forceX(0).strength((0.01 * height) / width))
            .force("y", d3.forceY(0).strength((0.01 * width) / height))
            .force("charge", d3.forceManyBody().strength(-10))
            .force("fixedPosForce", fixedPosForce());

        this.fixedPosForce = this.d3simulation.force("fixedPosForce");
    };

    componentDidMount() {
        this.d3simulation = d3.forceSimulation().on("tick", this.drawGraph);

        this.graphCanvas = d3
            .select(this.outer.current)
            .append("canvas")
            .attr("width", this.width)
            .attr("height", this.height)
            .node();

        this.zoomBehavior = d3
            .zoom()
            .scaleExtent([
                (1 / 4) * this.devicePixelRatio,
                4 * this.devicePixelRatio,
            ])
            .on("zoom", this.onZoom);

        d3.select(this.graphCanvas)
            .on("click", this.onClick)
            .on("dblclick", this.onDoubleClick)
            .on("mousemove", this.onMouseMove)
            .call(
                d3
                    .drag()
                    .subject(this.dragsubject)
                    .on("start", this.dragstarted)
                    .on("drag", this.dragged),
            )
            .call(this.zoomBehavior);

        this.onResize();
        this.updateDocument(this.props.nodes, this.props.edges);

        this.resizeObserver = window.setInterval(this.onResize, 500);
    }

    componentWillUnmount() {
        clearInterval(this.resizeObserver);
    }

    getD3EventCoords = event => {
        // TODO: event object probably already has inverted coords,
        // so this whole method is redundant.
        return this.state.transform.invert([event.x, event.y]);
    };

    findNodeAtPos = (x, y) => {
        let minI = -1;
        let minD = 1e10;
        this.document.nodes.forEach((n, i) => {
            const d = (n.x - x) * (n.x - x) + (n.y - y) * (n.y - y);
            if (d < minD) {
                minI = i;
                minD = d;
            }
        });

        if (minI < 0 || minD > NODE_RADIUS * NODE_RADIUS) {
            return null;
        }
        return this.document.nodes[minI];
    };

    onMouseMove = () => {
        const { offsetX: x, offsetY: y } = currentEvent;
        const pt = this.getD3EventCoords({ x, y });

        const node = this.findNodeAtPos(...pt);
        if (this.props.onNodeHovered) {
            this.props.onNodeHovered(node);
        }
    };

    onClick = () => {
        const { offsetX: x, offsetY: y } = currentEvent;
        const pt = this.getD3EventCoords({ x, y });

        const node = this.findNodeAtPos(...pt);
        if (node) {
            currentEvent.stopImmediatePropagation();
            return this.props.onNodeSelected(node);
        }
    };

    onDoubleClick = () => {
        const { offsetX: x, offsetY: y } = currentEvent;
        const pt = this.getD3EventCoords({ x, y });

        const node = this.findNodeAtPos(...pt);
        if (node) {
            currentEvent.stopImmediatePropagation();
            return this.props.onNodeDoubleClicked(node);
        }
    };

    dragsubject = () => {
        const { offsetX: x, offsetY: y } = currentEvent.sourceEvent;
        const pt = this.getD3EventCoords({ x, y });

        const selectedNode = this.findNodeAtPos(...pt);

        this.setState({
            selectedNode: selectedNode,
        });
        if (this.props.onNodeSelected) {
            this.props.onNodeSelected(selectedNode);
        }
        return selectedNode;
    };

    dragstarted = () => {
        if (!currentEvent.active) {
            setTimeout(
                () => this.d3simulation.alpha(0.5).restart(),
                DOUBLE_CLICK_MS,
            );
        }
    };

    dragged = () => {
        const { offsetX: x, offsetY: y } = currentEvent.sourceEvent;
        const pt = this.getD3EventCoords({ x, y });

        this.fixedPosForce.setNodeCoords(currentEvent.subject, ...pt);
        this.drawGraph();

        this.d3simulation.alpha(Math.max(0.12, this.d3simulation.alpha()));
    };

    onZoom = () => {
        this.setState({ transform: currentEvent.transform });
    };

    onResize = () => {
        let resized = false;
        if (this.outer.current) {
            const el = this.outer.current;

            resized |= this.width !== el.offsetWidth;
            resized |= this.height !== el.offsetHeight;

            this.width = el.offsetWidth;
            this.height = el.offsetHeight;
        }

        if (!resized) {
            return;
        }

        const { width, height } = this;
        this.zoomBehavior.scaleTo(d3.select(this.graphCanvas), 1);
        this.zoomBehavior.translateTo(d3.select(this.graphCanvas), 0, 0);

        this.setForces(width, height);

        d3.select(this.graphCanvas)
            .attr("width", this.width * this.devicePixelRatio)
            .attr("height", this.height * this.devicePixelRatio);

        this.canvasContext = this.graphCanvas.getContext("2d");

        this._drawAll();
    };

    updateDocument = (nodes, edges) => {
        if (!this.d3simulation || !nodes || !edges) {
            return;
        }

        if (
            this.document.nodesLength !== nodes.length ||
            this.document.edgesLength !== edges.length
        ) {
            this.d3simulation.alpha(1).restart();
        }

        this.document = {
            edges,
            edgesLength: edges.length,
            nodes,
            nodesLength: nodes.length,
        };

        this.d3simulation.nodes(nodes);
        this.d3simulation.force("link").links(edges);
    };

    render() {
        this.onResize();
        this.drawGraph();

        this.updateDocument(this.props.nodes, this.props.edges);

        return <div ref={this.outer} className="graph-outer" />;
    }
}
