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

import React from "react";
import cloneDeep from "lodash.clonedeep";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";

import { getPredicateQuery } from "../../lib/dgraph-syntax";

const predicateErrorStrings = [
    "<",
    ">",
    '"',
    "~",
    "{",
    "}",
    "|",
    "^",
    "`",
    "@",
];

export default class SchemaPredicateForm extends React.Component {
    constructor(props) {
        super(props);

        const predicate = cloneDeep(props.predicate);
        // Default values for predicate keys.
        predicate.tokenizer = predicate.tokenizer || [];
        predicate.predicate = predicate.predicate || "";
        predicate.type = predicate.type || "int";
        predicate.list = !!predicate.list;
        predicate.count = !!predicate.count;
        predicate.reverse = !!predicate.reverse;
        predicate.index = !!predicate.index;
        predicate.upsert = !!predicate.upsert;
        predicate.lang = !!predicate.lang;

        this.state = {
            originalQuery: getPredicateQuery(predicate),
            predicate,
        };
    }

    getPredicateQuery = () => getPredicateQuery(this.getPredicate());

    isDirty = () =>
        getPredicateQuery(this.state.predicate) !== this.state.originalQuery;

    getPredicate = () => this.state.predicate;

    getNameErrorMsg = () => {
        const { predicate } = this.state;

        const name = predicate.predicate;
        if (name.length === 0) {
            return "The Predicate field cannot be empty";
        }

        for (let char of name) {
            if (
                char.charCodeAt(0) <= 32 ||
                predicateErrorStrings.indexOf(char) >= 0
            ) {
                return `The Predicate field cannot contain whitespace or any of the following characters: ${predicateErrorStrings.join(
                    ", ",
                )}`;
            }
        }

        return "";
    };

    getTokenizerErrors = () => {
        const { predicate } = this.state;

        const warnings = [];
        const arr = predicate.tokenizer;

        if (predicate.type === "string") {
            const hasExact = arr.indexOf("exact") >= 0;
            const hasHash = arr.indexOf("hash") >= 0;
            const hasTerm = arr.indexOf("term") >= 0;
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

            if (predicate.index && arr.length === 0) {
                // NOTE: predicate is string && indexed => tokenizer is required
                warnings.push("At least 1 tokenizer should be selected");
            }
        }

        if (
            predicate.type === "datetime" &&
            predicate.index &&
            arr.length === 0
        ) {
            // NOTE: predicate is string && indexed => tokenizer is required
            warnings.push("At least 1 tokenizer should be selected");
        }

        return warnings;
    };

    /*
        A helper for mutating the internal predicate object.
        Takes property name and a function, and returns a function that:
        1) clones internal predicate and sets predicate[propName] to newValue
        2) calls extraFn on the newly mutated predicate
        3) calls this.setState with the mutated predicate copy.
    */
    handlePropertyChange = (propName, extraFn) => newValue => {
        const { predicate } = this.state;
        const newPredicate = cloneDeep(predicate);

        if (newPredicate[propName] === newValue) {
            return;
        }

        newPredicate[propName] = newValue;
        if (extraFn) {
            extraFn(newPredicate);
        }

        this.setState(
            {
                predicate: newPredicate,
            },
            () => {
                if (this.props.onChangeQuery) {
                    this.props.onChangeQuery(this.getPredicateQuery());
                }
            },
        );
    };

    useEventTargetValue = fn => event => fn(event.target.value);
    useEventTargetChecked = fn => event => fn(event.target.checked);

    handleTypeChange = this.useEventTargetValue(
        this.handlePropertyChange("type", predicate => {
            predicate.list = false;
            predicate.count = false;
            predicate.reverse = false;
            predicate.index = false;
            predicate.tokenizer = [];
            predicate.upsert = false;
            predicate.lang = false;
        }),
    );

    transformTokenizerEvent = (tok, event) => {
        const { predicate } = this.state;
        if (predicate.type !== "string") {
            return [tok];
        }
        // Invariant: type is string
        const oldList = predicate.tokenizer;
        if (event.target.checked) {
            return [...oldList, tok];
        } else {
            return oldList.filter(x => x !== tok);
        }
    };

    handleTokenizerChange = (tok, event) => {
        const newTokenizer = this.transformTokenizerEvent(tok, event);
        this.handlePropertyChange("tokenizer")(newTokenizer);
    };

    handleListChange = this.useEventTargetChecked(
        this.handlePropertyChange("list", p => {
            if (!p.list) {
                p.count = false;
            }
        }),
    );

    handleNameChange = this.useEventTargetValue(
        this.handlePropertyChange("predicate"),
    );

    handleCountChange = this.useEventTargetChecked(
        this.handlePropertyChange("count"),
    );

    handleReverseChange = this.useEventTargetChecked(
        this.handlePropertyChange("reverse"),
    );

    handleIndexChange = this.useEventTargetChecked(
        this.handlePropertyChange("index", predicate => {
            if (predicate.index) {
                if (predicate.type === "datetime") {
                    predicate.tokenizer = ["year"];
                } else if (predicate.type !== "string") {
                    predicate.tokenizer = [predicate.type];
                }
            } else {
                predicate.tokenizer = [];
            }

            predicate.upsert = false;
        }),
    );

    handleUpsertChange = this.useEventTargetChecked(
        this.handlePropertyChange("upsert"),
    );

    handleLangChange = this.useEventTargetChecked(
        this.handlePropertyChange("lang", predicate => {
            if (predicate.type !== "string") {
                predicate.lang = false;
            }
        }),
    );

    renderCountInput = predicate => {
        if (!predicate.list) {
            return null;
        }
        return (
            <Form.Check
                type="checkbox"
                checked={predicate.count}
                id="check-count"
                label="count"
                onChange={this.handleCountChange}
            />
        );
    };

    renderLangInput = predicate => {
        if (predicate.type !== "string") {
            return null;
        }
        return (
            <Form.Check
                type="checkbox"
                checked={predicate.lang}
                id="check-lang"
                label="lang"
                onChange={this.handleLangChange}
            />
        );
    };

    renderReverseInput = predicate => {
        if (predicate.type !== "uid") {
            return null;
        }
        return (
            <Form.Check
                type="checkbox"
                checked={predicate.reverse}
                id="check-reverse"
                label="reverse"
                onChange={this.handleReverseChange}
            />
        );
    };

    hasErrors() {
        const { createMode } = this.props;
        const { predicate } = this.state;

        if (createMode && this.getNameErrorMsg()) {
            return true;
        }
        if (!predicate.index) {
            return false;
        }

        if (this.getTokenizerErrors().length) {
            return true;
        }

        return false;
    }

    render() {
        const { predicate } = this.state;
        const { createMode } = this.props;
        const nameErrorMsg = this.getNameErrorMsg();
        const tokenizerErrors = this.getTokenizerErrors();

        let listInput;
        let countInput = this.renderCountInput(predicate);
        let reverseInput = this.renderReverseInput(predicate);
        let indexInput;
        let tokenizersFormGroup;
        let langInput = this.renderLangInput(predicate);

        const helpDivIndexing = (
            <div style={{ marginTop: "5px" }}>
                Need help with indexing?{" "}
                <a
                    href="https://docs.dgraph.io/query-language/#indexing"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    View Docs
                </a>
            </div>
        );

        const tokenizerErrorList = !tokenizerErrors ? null : (
            <div
                style={{
                    color: "#f09f2e",
                    marginTop: "5px",
                }}
            >
                <ul>
                    {tokenizerErrors.map(errMsg => (
                        <li
                            key={errMsg}
                            style={{
                                marginTop: "5px",
                            }}
                        >
                            {errMsg}
                        </li>
                    ))}
                </ul>
            </div>
        );

        if (predicate.type !== "password") {
            listInput = (
                <Form.Check
                    type="checkbox"
                    checked={predicate.list}
                    id="check-list"
                    label="list"
                    onChange={this.handleListChange}
                />
            );

            if (predicate.type !== "uid") {
                indexInput = (
                    <Form.Check
                        type="checkbox"
                        checked={predicate.index}
                        id="check-index"
                        label="index"
                        onChange={this.handleIndexChange}
                    />
                );
            }
        }

        const upsertInput = !predicate.index ? null : (
            <Form.Check
                type="checkbox"
                checked={predicate.upsert}
                id="check-upsert"
                label="upsert"
                onChange={this.handleUpsertChange}
            />
        );

        if (predicate.index && predicate.type === "string") {
            const tokenizers = ["exact", "hash", "term", "fulltext", "trigram"];
            tokenizersFormGroup = (
                <Form.Group as={Form.Row}>
                    <Form.Label column sm={3}>
                        Tokenizer(s)
                    </Form.Label>
                    <Col sm={9}>
                        {tokenizers.map(tok => (
                            <Form.Check
                                key={tok}
                                type="checkbox"
                                checked={predicate.tokenizer.indexOf(tok) >= 0}
                                id={"check-" + tok}
                                label={tok}
                                onChange={event =>
                                    this.handleTokenizerChange(tok, event)
                                }
                            />
                        ))}
                        {tokenizerErrorList}
                        {helpDivIndexing}
                    </Col>
                </Form.Group>
            );
        }

        if (predicate.index && predicate.type === "datetime") {
            const tokenizers = ["year", "month", "day", "hour"];
            tokenizersFormGroup = (
                <Form.Group as={Form.Row}>
                    <Form.Label column sm={3}>
                        Tokenizer
                    </Form.Label>
                    <Col sm={9}>
                        {tokenizers.map(tok => (
                            <Form.Check
                                key={tok}
                                type="radio"
                                name="tokenizer-radio"
                                id={"radio-date-" + tok}
                                label={tok}
                                value={tok}
                                checked={predicate.tokenizer.indexOf(tok) >= 0}
                                onChange={event =>
                                    this.handleTokenizerChange(tok, event)
                                }
                            />
                        ))}
                        {helpDivIndexing}
                    </Col>
                </Form.Group>
            );
        }

        const predicateName = (
            <Col sm={9}>
                <Form.Control
                    type="text"
                    id="predicate-input"
                    placeholder="Predicate"
                    value={predicate.predicate}
                    onChange={this.handleNameChange}
                    disabled={!createMode}
                />
                {createMode &&
                predicate.predicate.length > 1 &&
                nameErrorMsg ? (
                    <div className="alert alert-danger">{nameErrorMsg}</div>
                ) : null}
            </Col>
        );

        const typeSelectBox = (
            <select
                className="form-control"
                id="type-input"
                value={predicate.type}
                onChange={this.handleTypeChange}
            >
                {[
                    "default",
                    "bool",
                    "datetime",
                    "float",
                    "geo",
                    "int",
                    "password",
                    "string",
                    "uid",
                ].map(name => (
                    <option key={name}>{name}</option>
                ))}
            </select>
        );

        return (
            <Form>
                <Form.Group as={Form.Row}>
                    <Form.Label column sm={3}>
                        Predicate
                    </Form.Label>
                    {predicateName}
                </Form.Group>

                <Form.Group as={Form.Row}>
                    <Form.Label column sm={3}>
                        Type
                    </Form.Label>
                    <Col sm={9}>
                        <div className="type-input select">{typeSelectBox}</div>
                    </Col>
                </Form.Group>
                <Form.Group as={Form.Row}>
                    <Col sm={{ offset: 3, span: 9 }}>
                        {listInput}
                        {countInput}
                        {langInput}
                        {reverseInput}
                        {indexInput}
                        {upsertInput}
                    </Col>
                </Form.Group>
                {tokenizersFormGroup}
            </Form>
        );
    }
}
