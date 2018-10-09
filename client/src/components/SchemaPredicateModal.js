import React from "react";
import Raven from "raven-js";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";
import { executeQuery } from "../lib/helpers";
import SchemaPredicateForm from "./SchemaPredicateForm";

export default class SchemaPredicateModal extends React.Component {
    constructor(props) {
        super(props);

        this.predicateForm = React.createRef();

        this.state = {
            updating: false,
            deleting: false,
            show: true,
            clickedSubmit: false,
            errorMsg: "",
            predicateQuery: null,
        };
    }

    close = () => {
        const { onClose } = this.props;
        this.setState({ show: false });
        onClose && onClose();
    };

    async updatePredicate(onSuccess) {
        const {
            idx,
            url,
            onUpdatePredicate,
            onUpdateConnectedState,
        } = this.props;

        this.setState({
            updating: true,
            errorMsg: "",
        });

        try {
            const res = await executeQuery(
                url,
                this.state.predicateQuery,
                "alter",
                true,
            );

            onUpdateConnectedState(true);

            console.log("done update ", res, this.state.predicateQuery);

            if (res.errors) {
                this.setState({
                    errorMsg: `Could not alter schema: ${
                        res.errors[0].message
                    }`,
                });
            } else {
                console.log("on ssu ", onUpdatePredicate);

                onSuccess && onSuccess();

                // NOTE: onUpdatePredicate should be called last as it unmounts this component.
                onUpdatePredicate(idx, this.state.predicateQuery);
            }
        } catch (error) {
            // If no response, it's a network error or client side runtime error.
            const errorText = error.response
                ? await error.response.text()
                : error.message;

            // Capture client side error not query execution error from server.
            // FIXME: This captures 404.
            Raven.captureException(error);
            onUpdateConnectedState(false);

            this.setState({
                errorMsg: `Could not connect to the server: ${errorText}`,
            });
        } finally {
            this.setState({ updating: false });
        }
    }

    async deletePredicate(onSuccess) {
        const {
            idx,
            predicate,
            url,
            onUpdatePredicate,
            onUpdateConnectedState,
        } = this.props;

        this.setState({
            deleting: true,
            errorMsg: "",
        });

        const query = JSON.stringify({ drop_attr: predicate.predicate });

        try {
            const res = await executeQuery(url, query, "alter", true);

            onUpdateConnectedState(true);

            if (res.errors) {
                this.setState({
                    errorMsg: `Could not delete predicate: ${
                        res.errors[0].message
                    }`,
                });
            } else {
                onSuccess && onSuccess();

                // NOTE: onUpdatePredicate should be called last as it unmounts this component.
                onUpdatePredicate(idx, null, true);
            }
        } catch (error) {
            // No response, it's a network error or client side runtime error.
            const errorText = error.response
                ? await error.response.text()
                : error.message;

            // Capture client side error not query execution error from server.
            // FIXME: This captures 404.
            Raven.captureException(error);
            onUpdateConnectedState(false);

            this.setState({
                errorMsg: `Could not connect to the server: ${errorText}`,
            });
        } finally {
            this.setState({
                deleting: false,
            });
        }
    }

    handleSubmit = () => {
        this.setState({
            clickedSubmit: true,
        });

        this.updatePredicate(this.close);
    };

    handleDelete = () => this.deletePredicate(this.close);

    handleCancel = () => {
        const { onCancel } = this.props;
        this.close();
        onCancel && onCancel();
    };

    render() {
        const { create, predicate } = this.props;
        const {
            updating,
            deleting,
            clickedSubmit,
            errorMsg,
            predicateQuery,
        } = this.state;

        const predicateForm = this.predicateForm.current;

        const canUpdate =
            predicateForm &&
            predicateForm.isDirty() &&
            !predicateForm.hasErrors();

        return (
            <Modal show={this.state.show} onHide={this.handleCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {create ? "Add Predicate" : "Update Predicate"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <SchemaPredicateForm
                        createMode={create}
                        clickedSubmit={clickedSubmit}
                        ref={this.predicateForm}
                        predicate={predicate}
                        onChangeQuery={predicateQuery =>
                            this.setState({ predicateQuery })
                        }
                    />
                    {errorMsg ? (
                        <div>
                            <p style={{ color: "#dc3545", marginTop: "18px" }}>
                                {errorMsg}
                            </p>
                        </div>
                    ) : null}
                    {!predicateForm ? null : (
                        <div className="form-group clearfix">
                            <label className="col-sm-3 control-label" />
                            <div className="col-sm-9" style={{ color: "#666" }}>
                                Schema string:
                                <span style={{ fontStyle: "italic" }}>
                                    {predicateQuery}
                                </span>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {create ? null : (
                        <Button
                            bsStyle="danger"
                            className="pull-left"
                            onClick={this.handleDelete}
                            disabled={updating || deleting}
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    )}
                    <Button onClick={this.handleCancel}>Cancel</Button>
                    <Button
                        bsStyle="primary"
                        onClick={this.handleSubmit}
                        disabled={!canUpdate || updating || deleting}
                    >
                        {updating
                            ? create
                                ? "Adding..."
                                : "Updating..."
                            : create
                                ? "Add"
                                : "Update"}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
