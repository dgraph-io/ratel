import React from "react";
import _ from "lodash";

import { getPredicateQuery } from "../lib/dgraph-syntax";

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

        const predicate = _.cloneDeep(props.predicate);
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
        const newPredicate = _.cloneDeep(predicate);

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
            if (!p.list && p.type !== "uid") {
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
        if (predicate.type !== "uid" && !predicate.list) {
            return null;
        }
        return (
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
    };

    renderLangInput = predicate => {
        if (predicate.type !== "string") {
            return null;
        }
        return (
            <div className="checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={predicate.lang}
                        onChange={this.handleLangChange}
                    />{" "}
                    lang
                </label>
            </div>
        );
    };

    renderReverseInput = predicate => {
        if (predicate.type !== "uid") {
            return null;
        }
        return (
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

        const upsertInput = !predicate.index ? null : (
            <div className="checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={predicate.upsert}
                        onChange={this.handleUpsertChange}
                    />{" "}
                    upsert
                </label>
            </div>
        );

        if (predicate.index && predicate.type === "string") {
            const tokenizers = ["exact", "hash", "term", "fulltext", "trigram"];
            tokenizersFormGroup = (
                <div className="form-group">
                    <label className="col-sm-3 control-label">
                        Tokenizer(s)
                    </label>
                    <div className="col-sm-9">
                        {tokenizers.map(tok => (
                            <div key={tok} className="checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={
                                            predicate.tokenizer.indexOf(tok) >=
                                            0
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
                        ))}
                        {tokenizerErrorList}
                        {helpDivIndexing}
                    </div>
                </div>
            );
        }

        if (predicate.index && predicate.type === "datetime") {
            const tokenizers = ["year", "month", "day", "hour"];
            tokenizersFormGroup = (
                <div className="form-group">
                    <label className="col-sm-3 control-label">Tokenizer</label>
                    <div className="col-sm-9">
                        {tokenizers.map(tok => (
                            <div key={tok} className="radio">
                                <label>
                                    <input
                                        name="tokenizer-radio"
                                        type="radio"
                                        value={tok}
                                        checked={
                                            predicate.tokenizer.indexOf(tok) >=
                                            0
                                        }
                                        onChange={event =>
                                            this.handleTokenizerChange(
                                                tok,
                                                event,
                                            )
                                        }
                                    />
                                    &nbsp;
                                    {tok}
                                </label>
                            </div>
                        ))}
                        {helpDivIndexing}
                    </div>
                </div>
            );
        }

        const predicateName = (
            <div className="col-sm-9">
                <input
                    type="text"
                    className="form-control"
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
            </div>
        );

        const typeSelectBox = (
            <select
                className="form-control"
                id="type-input"
                value={predicate.type}
                onChange={this.handleTypeChange}
            >
                {[
                    "int",
                    "float",
                    "string",
                    "bool",
                    "datetime",
                    "geo",
                    "password",
                    "uid",
                ].map(name => (
                    <option key={name}>{name}</option>
                ))}
            </select>
        );

        return (
            <form className="form-horizontal">
                <div className="form-group">
                    <label
                        htmlFor="predicate-input"
                        className="col-sm-3 control-label"
                    >
                        Predicate:
                    </label>
                    {predicateName}
                </div>
                <div className="form-group">
                    <label
                        htmlFor="type-input"
                        className="col-sm-3 control-label"
                    >
                        Type:
                    </label>
                    <div className="col-sm-9">
                        <div className="type-input select">{typeSelectBox}</div>
                        {listInput}
                        {countInput}
                        {langInput}
                        {reverseInput}
                        {indexInput}
                        {upsertInput}
                    </div>
                </div>
                {tokenizersFormGroup}
            </form>
        );
    }
}
