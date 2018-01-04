import React from "react";
import Raven from "raven-js";
import _ from "lodash";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";

import { executeQuery, processUrl } from "../lib/helpers";

function clonePredicate(predicate) {
    return {
        ...predicate,
        tokenizer: [...(predicate.tokenizer || [])],
    };
}

function arrayHas(arr, el) {
    if (!_.isArray(arr)) {
        return false;
    }

    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === el) {
            return true;
        }
    }

    return false;
}

export default class SchemaPredicateModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            predicate: clonePredicate(props.predicate),
            changed: false,
            query: "",
            warnings: [],
            show: false,
            showError: false,
            errorMsg: "",
        };
    }

    open = () => {
        this.setState({ show: true });
    };

    close = () => {
        this.setState({ show: false });
    };

    validateTokenizers = () => {
        const { predicate } = this.state;

        const warnings = [];
        if (predicate.type === "string") {
            const hasExact = arrayHas("exact");
            const hasHash = arrayHas("hash");
            const hasTerm = arrayHas("term");
            if (hasExact && hasHash) {
                warnings.push(
                    "'exact' and 'hash' index types shouldn't be used together",
                );
            }
            if (hasTerm && (hasExact || hasHash)) {
                warnings.push(
                    "'exact' or 'hash' index types shouldn't be used alongside the 'term' index type",
                );
            }
        }

        return warnings;
    };

    getQuery = () => {
        const { predicate } = this.state;

        let type = predicate.type;
        if (predicate.list) {
            type = "[" + type + "]";
        }

        let hasIndex = !!predicate.index;
        let tokenizers = "";
        if (hasIndex) {
            tokenizers = predicate.tokenizer.join(", ");
        }

        return `${predicate.predicate}: ${type}${
            hasIndex ? ` @index(${tokenizers})` : ""
        }${predicate.count ? " @count" : ""} ${
            predicate.reverse ? " @reverse" : ""
        } .`;
    };

    updatePredicate = () => {
        const { url, onUpdatePredicate, onUpdateConnectedState } = this.props;

        executeQuery(url, this.getQuery(), "alter", true)
            .then(res => {
                onUpdateConnectedState(true);

                if (res.errors) {
                    this.setState({
                        errorMsg: `Could not alter schema: ${
                            res.errors[0].message
                        }`,
                    });
                } else {
                    this.setState({
                        changed: false,
                    });

                    onUpdatePredicate();
                }
            })
            .catch(error => {
                // FIXME: make it DRY. but error.response.text() is async and error.message is sync.

                // If no response, it's a network error or client side runtime error.
                if (!error.response) {
                    // Capture client side error not query execution error from server.
                    // FIXME: This captures 404.
                    Raven.captureException(error);
                    onUpdateConnectedState(false);

                    this.setState({
                        errorMsg: `Could not connect to the server: ${
                            error.message
                        }`,
                    });
                } else {
                    error.response.text().then(text => {
                        this.setState({
                            errorMsg: `Could not connect to the server: ${text}`,
                        });
                    });
                }
            });
    };

    handleChange = () => {
        const query = this.getQuery();
        if (query.errorMsg) {
            this.setState({
                errorMsg: query.errorMsg,
            });
        } else {
            this.setState({
                query,
                errorMsg: "",
            });
        }
    };

    handleSubmit = () => {};

    handleCancel = () => {
        const { onCancel } = this.props;
        this.close();
        onCancel && onCancel();
    };

    render() {
        return null;
        // return (
        //     <Modal show={this.state.show} onHide={this.handleCancel}>
        //         <Modal.Header closeButton>
        //             <Modal.Title>Update URL</Modal.Title>
        //         </Modal.Header>
        //         <Modal.Body>
        //             <h4>Enter Dgraph server URL:</h4>
        //             <div
        //                 style={{
        //                     margin: "15px 0",
        //                 }}
        //             >
        //                 <input
        //                     type="text"
        //                     placeholder="ex. https://dgraph.example.com/api"
        //                     value={this.state.urlString}
        //                     onChange={this.handleUrlTextUpdate}
        //                     onKeyPress={this.handleKeyPress}
        //                     style={{
        //                         padding: "5px 8px",
        //                         width: "100%",
        //                         fontSize: "1.08em",
        //                     }}
        //                 />
        //                 {this.state.showError ? (
        //                     <p style={{ color: "#dc3545", marginTop: "5px" }}>
        //                         {}
        //                     </p>
        //                 ) : null}
        //             </div>
        //         </Modal.Body>
        //         <Modal.Footer>
        //             <Button onClick={this.handleCancel}>Cancel</Button>
        //             <Button
        //                 bsStyle="primary"
        //                 onClick={this.handleSubmit}
        //                 disabled={!this.state.urlString.trim()}
        //             >
        //                 Update
        //             </Button>
        //         </Modal.Footer>
        //     </Modal>
        // );
    }
}
