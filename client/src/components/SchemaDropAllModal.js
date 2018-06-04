import React from "react";
import Raven from "raven-js";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";

import { executeQuery } from "../lib/helpers";

export default class SchemaDropAllModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            show: true,
            loading: false,
            errorMsg: "",
        };
    }

    open = () => {
        this.setState({ show: true });
    };

    close = () => {
        const { onClose } = this.props;
        this.setState({ show: false });
        onClose && onClose();
    };

    dropAll = onSuccess => {
        const { url, onDropAll, onUpdateConnectedState } = this.props;
        const query = JSON.stringify({ drop_all: true });
        this.setState({
            loading: true,
            errorMsg: "",
        });

        executeQuery(url, query, "alter", true)
            .then(res => {
                onUpdateConnectedState(true);

                if (res.errors) {
                    this.setState({
                        loading: false,
                        errorMsg: `Could not drop all: ${
                            res.errors[0].message
                        }`,
                    });
                } else {
                    this.setState({
                        loading: false,
                    });

                    onSuccess && onSuccess();

                    // NOTE: onDropAll should be called last as it unmounts this component.
                    onDropAll();
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
                        loading: false,
                        errorMsg: `Could not connect to the server: ${
                            error.message
                        }`,
                    });
                } else {
                    error.response.text().then(text => {
                        this.setState({
                            loading: false,
                            errorMsg: `Could not connect to the server: ${text}`,
                        });
                    });
                }
            });
    };

    handleDropAll = () => {
        this.dropAll(this.close);
    };

    handleCancel = () => {
        const { onCancel } = this.props;
        this.close();
        onCancel && onCancel();
    };

    render() {
        const { loading, errorMsg } = this.state;

        return (
            <Modal show={this.state.show} onHide={this.handleCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>Drop All</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete all of your data including
                    the schema? You won't be able to restore your data once it
                    has been deleted.
                    {errorMsg ? (
                        <div>
                            <p style={{ color: "#dc3545", marginTop: "18px" }}>
                                {errorMsg}
                            </p>
                        </div>
                    ) : null}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleCancel}>Cancel</Button>
                    <Button bsStyle="danger" onClick={this.handleDropAll}>
                        {loading ? "Dropping All..." : "Drop All"}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
