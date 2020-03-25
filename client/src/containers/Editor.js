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
import isEmpty from "lodash.isempty";

import { getDgraphClient } from "lib/helpers";

import "../assets/css/Editor.scss";

import "codemirror/addon/hint/show-hint.css";

const CodeMirror = require("codemirror");
require("codemirror/addon/hint/show-hint");
require("codemirror/addon/comment/comment");
require("codemirror/addon/edit/matchbrackets");
require("codemirror/addon/edit/closebrackets");
require("codemirror/addon/fold/foldcode");
require("codemirror/addon/fold/foldgutter");
require("codemirror/addon/fold/brace-fold");
require("codemirror/addon/lint/lint");
require("codemirror/keymap/sublime");
require("codemirror/mode/javascript/javascript");
require("codemirror-graphql/hint");
require("codemirror-graphql/lint");
require("codemirror-graphql/info");
require("codemirror-graphql/jump");
require("codemirror-graphql/mode");

function isJSON(value) {
    return /^\s*{\s*"/.test(value);
}

function sortStrings(a, b) {
    const nameA = a.toLowerCase();
    const nameB = b.toLowerCase();

    return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
}

export default class Editor extends React.Component {
    constructor(props) {
        super(props);
        this._editorRef = React.createRef();
        this._bodyRef = React.createRef();

        this.state = {
            height: 10,
            width: 100,
        };
    }

    async componentDidMount() {
        const { mode, readOnly } = this.props;
        let keywords = [];

        const client = await getDgraphClient();

        try {
            const result = await client.fetchUiKeywords();
            keywords = result.keywords.map(kw => kw.name);
        } catch (error) {
            console.warn(
                "In catch: Error while trying to fetch list of keywords",
                error,
            );
        }

        try {
            const schemaResponse = await client.newTxn().query("schema {}");

            const schema = schemaResponse.data.schema;
            if (schema && !isEmpty(schema)) {
                keywords = keywords.concat(
                    schema.map(kw => kw.predicate),
                    schema.map(kw => `<${kw.predicate}>`),
                );
            }
        } catch (error) {
            console.warn("In catch: Error while trying to fetch schema", error);
        }

        this.editor = CodeMirror(this._editorRef.current, {
            autofocus: true,
            value: this.props.query,
            lineNumbers: true,
            tabSize: 2,
            lineWrapping: true,
            mode: mode || "graphql",
            readOnly: readOnly || false,
            theme: "neo",
            keyMap: "sublime",
            autoCloseBrackets: true,
            completeSingle: false,
            showCursorWhenSelecting: true,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            extraKeys: {
                "Ctrl-Space": cm => {
                    CodeMirror.commands.autocomplete(cm);
                },
                "Cmd-Space": cm => {
                    CodeMirror.commands.autocomplete(cm);
                },
                "Cmd-Enter": () => {
                    const { onHotkeyRun } = this.props;
                    onHotkeyRun && onHotkeyRun(this.getValue());
                },
                "Ctrl-Enter": () => {
                    const { onHotkeyRun } = this.props;
                    onHotkeyRun && onHotkeyRun(this.getValue());
                },
            },
            viewportMargin: 200,
        });

        this.editor.setCursor(this.editor.lineCount(), 0);

        CodeMirror.registerHelper("hint", "fromList", (cm, options) => {
            const cur = cm.getCursor();
            const token = cm.getTokenAt(cur);

            const to = CodeMirror.Pos(cur.line, token.end);
            let from = "",
                term = "";
            if (token.string) {
                term = token.string;
                from = CodeMirror.Pos(cur.line, token.start);
            } else {
                term = "";
                from = to;
            }

            // So that we don't autosuggest for anyof/allof filter values which
            // would be inside quotes.
            if (term.length > 0 && term[0] === '"') {
                return { list: [], from: from, to: to };
            }

            // TODO: This is a hack because Graphiql mode considers . as an invalidchar.
            // Ideally we should write our own mode which allows . in predicate.
            if (
                token.type === "invalidchar" &&
                token.state.prevState !== undefined &&
                token.state.prevState.kind === "Field"
            ) {
                term = token.state.prevState.name + token.string;
                from.ch -= token.state.prevState.name.length;
            }

            // Because Codemirror strips the @ from a directive.
            if (token.state.kind === "Directive") {
                term = "@" + term;
                from.ch -= 1;
            }

            term = term.toLowerCase();
            if (term.trim().length === 0) {
                return {
                    list: options.words.sort(sortStrings),
                    from: to,
                    to: to,
                };
            }

            const found = [];
            for (let i = 0; i < options.words.length; i++) {
                const word = options.words[i];
                if (term.length > 0 && word.startsWith(term)) {
                    found.push(word);
                }
            }

            if (found.length) {
                return {
                    list: found.sort(sortStrings),
                    from: from,
                    to: to,
                };
            }
        });

        CodeMirror.commands.autocomplete = cm => {
            CodeMirror.showHint(cm, CodeMirror.hint.fromList, {
                completeSingle: false,
                words: keywords,
            });
        };

        this.editor.on("change", cm => {
            const value = this.editor.getValue();

            if (this.editor.getMode().name === "graphql") {
                if (isJSON(value)) {
                    this.editor.setOption("mode", {
                        name: "javascript",
                        json: true,
                    });
                }
            } else {
                if (!isJSON(value)) {
                    this.editor.setOption("mode", "graphql");
                }
            }

            const { onUpdateQuery } = this.props;
            if (onUpdateQuery) {
                onUpdateQuery(value);
            }
        });

        this.editor.on("keydown", (cm, event) => {
            const code = event.keyCode;

            if (!event.ctrlKey && code >= 65 && code <= 90) {
                CodeMirror.commands.autocomplete(cm);
            }
        });

        window.addEventListener("resize", this._onResize);
        this._onResize();
    }

    componentDidUpdate() {
        this._onResize();
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this._onResize);
    }

    _onResize = () => {
        if (!this._bodyRef.current) {
            return;
        }
        const { offsetWidth, offsetHeight } = this._bodyRef.current;
        // Only setState when dimensions actually changed to avoid infinite loop
        if (
            offsetWidth !== this.state.width ||
            offsetHeight !== this.state.height
        ) {
            setTimeout(
                this.setState.bind(this, {
                    height: offsetHeight,
                    width: offsetWidth,
                }),
            );
        }
    };

    getValue = () => {
        return !this.editor ? "" : this.editor.getValue();
    };

    getEditorStyles(maxHeight) {
        let h = 0;
        const isFillParent =
            maxHeight === "fillParent" ||
            maxHeight === null ||
            maxHeight === undefined;
        if (isFillParent) {
            h = this.state.height;
        } else {
            const lineCount = this.editor ? this.editor.lineCount() : 1;
            // These magic numbers have been measured using current CodeMirror
            // styles and automatic resizing of the editor div.
            // Every new line increases editor height by 20px, and editor with
            // N lines has height of 20*N+8 pixels.
            h = Math.min(8 + 20 * lineCount, maxHeight);
            h = Math.max(h, 68);
        }
        return {
            outer: { height: isFillParent ? null : h },
            inner: { height: `${h}px` },
        };
    }

    render() {
        const { query, maxHeight } = this.props;

        if (this.editor && query !== this.getValue()) {
            this.editor.setValue(query);
        }

        const style = this.getEditorStyles(maxHeight);

        return (
            <div
                className="editor-outer"
                style={style.outer}
                ref={this._bodyRef}
            >
                <div
                    ref={this._editorRef}
                    className="editor-size-el"
                    style={style.inner}
                />
            </div>
        );
    }
}
