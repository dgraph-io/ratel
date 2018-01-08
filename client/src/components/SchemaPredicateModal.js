import React from "react";
import Raven from "raven-js";
import _ from "lodash";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";

import { executeQuery } from "../lib/helpers";

const predicateErrorStrings = ["<", ">", '"', "{", "}", "|", "^", "`"];

function clonePredicate(predicate) {
    return {
        ...predicate,
        tokenizer: [...(predicate.tokenizer || [])],
    };
}

export default class SchemaPredicateModal extends React.Component {
    constructor(props) {
        super(props);

        const predicate = clonePredicate(props.predicate);
        // Default values for predicate keys.
        predicate.predicate = predicate.predicate || "";
        predicate.type = predicate.type || "int";
        predicate.list = predicate.list || false;
        predicate.count = predicate.count || false;
        predicate.reverse = predicate.reverse || false;
        predicate.index = predicate.index || false;

        this.state = {
            predicate,
            updating: false,
            deleting: false,
            changed: false,
            query: "",
            show: true,
            clickedSubmit: false,
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

    getPredicateErrorMsg = () => {
        const { predicate } = this.state;

        const predicateVal = predicate.predicate;
        if (predicateVal.length === 0) {
            return "The Predicate field cannot be empty";
        }

        for (let char of predicateVal) {
            if (
                char.charCodeAt(0) <= 32 ||
                _.indexOf(predicateErrorStrings, char) >= 0
            ) {
                return `The Predicate field cannot contain whiltespace or any of the following characters: ${predicateErrorStrings.join(
                    ", ",
                )}`;
            }
        }

        return "";
    };

    handlePredicateChange = event => {
        const { predicate } = this.state;

        predicate.predicate = event.target.value;

        this.setState({
            changed: true,
            predicate,
        });
    };

    handleTypeChange = event => {
        const { predicate } = this.state;

        const newValue = event.target.value;
        const prevValue = predicate.predicate;
        if (newValue === prevValue) {
            return;
        }

        predicate.type = newValue;
        predicate.list = false;
        predicate.count = false;
        predicate.reverse = false;
        predicate.index = false;
        predicate.tokenizer = [];

        this.setState({
            changed: true,
            predicate,
        });
    };

    getTokenizerErrorMsgs = () => {
        const { predicate } = this.state;

        const warnings = [];
        const arr = predicate.tokenizer;
        if (predicate.type === "string") {
            const hasExact = _.indexOf(arr, "exact") >= 0;
            const hasHash = _.indexOf(arr, "hash") >= 0;
            const hasTerm = _.indexOf(arr, "term") >= 0;
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

    handleTokenizerChange = (tok, event) => {
        const { predicate } = this.state;

        if (predicate.type === "string") {
            const checked = event.target.checked;
            const tokIndex = _.indexOf(predicate.tokenizer, tok);
            const tokPresent = tokIndex >= 0;

            if (tokPresent && !checked) {
                _.pullAt(predicate.tokenizer, [tokIndex]);
            } else if (!tokPresent && checked) {
                predicate.tokenizer.push(tok);
            }
        } else {
            predicate.tokenizer = [tok];
        }

        this.setState({
            changed: true,
            predicate,
        });
    };

    handleListChange = event => {
        const { predicate } = this.state;

        predicate.list = event.target.checked;
        this.setState({
            changed: true,
            predicate,
        });
    };

    handleCountChange = event => {
        const { predicate } = this.state;

        predicate.count = event.target.checked;
        this.setState({
            changed: true,
            predicate,
        });
    };

    handleReverseChange = event => {
        const { predicate } = this.state;

        predicate.reverse = event.target.checked;
        this.setState({
            changed: true,
            predicate,
        });
    };

    handleIndexChange = event => {
        const { predicate } = this.state;

        predicate.index = event.target.checked;

        let tokenizer = [];
        if (predicate.index) {
            if (predicate.type === "datetime") {
                tokenizer = ["year"];
            } else if (predicate.type !== "string") {
                tokenizer = [predicate.type];
            }
        }

        predicate.tokenizer = tokenizer;
        this.setState({
            changed: true,
            predicate,
        });
    };

    updatePredicate = onSuccess => {
        const {
            idx,
            predicate,
            url,
            onUpdatePredicate,
            onUpdateConnectedState,
        } = this.props;

        this.setState({
            updating: true,
            errorMsg: "",
        });

        executeQuery(url, this.getQuery(), "alter", true)
            .then(res => {
                onUpdateConnectedState(true);

                if (res.errors) {
                    this.setState({
                        updating: false,
                        errorMsg: `Could not alter schema: ${
                            res.errors[0].message
                        }`,
                    });
                } else {
                    this.setState({
                        updating: false,
                        changed: false,
                    });

                    onSuccess && onSuccess();

                    // NOTE: onUpdatePredicate should be called last as it unmounts this component.
                    onUpdatePredicate(idx, predicate);
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
                        updating: false,
                        errorMsg: `Could not connect to the server: ${
                            error.message
                        }`,
                    });
                } else {
                    error.response.text().then(text => {
                        this.setState({
                            updating: false,
                            errorMsg: `Could not connect to the server: ${text}`,
                        });
                    });
                }
            });
    };

    deletePredicate = onSuccess => {
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

        executeQuery(url, query, "alter", true)
            .then(res => {
                onUpdateConnectedState(true);

                if (res.errors) {
                    this.setState({
                        deleting: false,
                        errorMsg: `Could not delete predicate: ${
                            res.errors[0].message
                        }`,
                    });
                } else {
                    this.setState({
                        deleting: false,
                        changed: false,
                    });

                    onSuccess && onSuccess();

                    // NOTE: onUpdatePredicate should be called last as it unmounts this component.
                    onUpdatePredicate(idx, null, true);
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
                        deleting: false,
                        errorMsg: `Could not connect to the server: ${
                            error.message
                        }`,
                    });
                } else {
                    error.response.text().then(text => {
                        this.setState({
                            deleting: false,
                            errorMsg: `Could not connect to the server: ${text}`,
                        });
                    });
                }
            });
    };

    handleSubmit = () => {
        this.setState({
            clickedSubmit: true,
        });

        this.updatePredicate(this.close);
    };

    handleDelete = () => {
        this.deletePredicate(this.close);
    };

    handleCancel = () => {
        const { onCancel } = this.props;
        this.close();
        onCancel && onCancel();
    };

    render() {
        const { create } = this.props;
        const {
            changed,
            predicate,
            updating,
            deleting,
            clickedSubmit,
            errorMsg,
        } = this.state;

        const predicateErrorMsg = this.getPredicateErrorMsg();
        const tokenizerErrorMsgs = this.getTokenizerErrorMsgs();
        const hasTokenizer = !predicate.index || predicate.tokenizer.length > 0;
        const canUpdate =
            changed &&
            !predicateErrorMsg &&
            tokenizerErrorMsgs.length === 0 &&
            hasTokenizer;

        let listInput;
        let countInput;
        let reverseInput;
        let indexInput;
        let tokenizersFormGroup;
        if (predicate.type) {
            countInput = (
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            checked={predicate.count}
                            onChange={this.handleCountChange}
                        />{" "}
                        count
                    </label>
                </div>
            );

            if (predicate.type === "uid") {
                reverseInput = (
                    <div className="checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={predicate.reverse}
                                onChange={this.handleReverseChange}
                            />{" "}
                            reverse
                        </label>
                    </div>
                );
            } else if (predicate.type !== "password") {
                listInput = (
                    <div className="checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={predicate.list}
                                onChange={this.handleListChange}
                            />{" "}
                            list
                        </label>
                    </div>
                );

                indexInput = (
                    <div className="checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={predicate.index}
                                onChange={this.handleIndexChange}
                            />{" "}
                            index
                        </label>
                    </div>
                );
            }

            if (predicate.index) {
                if (predicate.type === "string") {
                    const tokenizers = [
                        "exact",
                        "hash",
                        "term",
                        "fulltext",
                        "trigram",
                    ];
                    tokenizersFormGroup = (
                        <div className="form-group">
                            <label className="col-sm-3 control-label">
                                Tokenizer(s)
                            </label>
                            <div className="col-sm-9">
                                {_.map(tokenizers, tok => {
                                    return (
                                        <div key={tok} className="checkbox">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        _.indexOf(
                                                            predicate.tokenizer,
                                                            tok,
                                                        ) >= 0
                                                    }
                                                    onChange={event =>
                                                        this.handleTokenizerChange(
                                                            tok,
                                                            event,
                                                        )
                                                    }
                                                />{" "}
                                                {tok}
                                            </label>
                                        </div>
                                    );
                                })}
                                {predicate.tokenizer.length === 0 ? (
                                    <p
                                        style={{
                                            color: "#dc3545",
                                            marginTop: "5px",
                                        }}
                                    >
                                        Atleast 1 tokenizer should be selected
                                    </p>
                                ) : null}
                                {tokenizerErrorMsgs ? (
                                    <div
                                        style={{
                                            color: "#f09f2e",
                                            marginTop: "5px",
                                        }}
                                    >
                                        {_.map(
                                            tokenizerErrorMsgs,
                                            (errMsg, i) => {
                                                return (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            marginTop: "5px",
                                                        }}
                                                    >
                                                        {errMsg}
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    );
                } else if (predicate.type === "datetime") {
                    const tokenizers = ["year", "month", "day", "hour"];
                    tokenizersFormGroup = (
                        <div className="form-group">
                            <label className="col-sm-3 control-label">
                                Tokenizer
                            </label>
                            <div className="col-sm-9">
                                {_.map(tokenizers, tok => {
                                    return (
                                        <div className="radio">
                                            <label>
                                                <input
                                                    name="tokenizer-radio"
                                                    type="radio"
                                                    value={tok}
                                                    checked={
                                                        _.indexOf(
                                                            predicate.tokenizer,
                                                            tok,
                                                        ) >= 0
                                                    }
                                                    onChange={event =>
                                                        this.handleTokenizerChange(
                                                            tok,
                                                            event,
                                                        )
                                                    }
                                                />{" "}
                                                {tok}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                }
            }
        }

        const predicateVal = (
            <div className="col-sm-9">
                <input
                    type="text"
                    className="form-control"
                    id="predicate-input"
                    placeholder="Predicate"
                    value={predicate.predicate}
                    onChange={this.handlePredicateChange}
                    disabled={!create}
                />
                {create && clickedSubmit && predicateErrorMsg ? (
                    <p
                        style={{
                            color: "#dc3545",
                            marginTop: "5px",
                        }}
                    >
                        {predicateErrorMsg}
                    </p>
                ) : null}
            </div>
        );

        return (
            <Modal show={this.state.show} onHide={this.handleCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {create ? "Add Predicate" : "Update Predicate"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form className="form-horizontal">
                        <div className="form-group">
                            <label
                                htmlFor="predicate-input"
                                className="col-sm-3 control-label"
                            >
                                Predicate
                            </label>
                            {predicateVal}
                        </div>
                        <div className="form-group">
                            <label
                                htmlFor="type-input"
                                className="col-sm-3 control-label"
                            >
                                Type
                            </label>
                            <div className="col-sm-9">
                                <div className="type-input select">
                                    <select
                                        className="form-control"
                                        id="type-input"
                                        value={predicate.type}
                                        onChange={this.handleTypeChange}
                                    >
                                        <option>int</option>
                                        <option>float</option>
                                        <option>string</option>
                                        <option>bool</option>
                                        <option>datetime</option>
                                        <option>geo</option>
                                        <option>password</option>
                                        <option>uid</option>
                                    </select>
                                </div>
                                {listInput}
                                {countInput}
                                {reverseInput}
                                {indexInput}
                            </div>
                        </div>
                        {tokenizersFormGroup}
                    </form>
                    {errorMsg ? (
                        <div>
                            <p style={{ color: "#dc3545", marginTop: "18px" }}>
                                {errorMsg}
                            </p>
                        </div>
                    ) : null}
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
                            ? create ? "Adding..." : "Updating..."
                            : create ? "Add" : "Update"}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
