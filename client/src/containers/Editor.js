import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

import {
    checkStatus,
    sortStrings,
    getEndpoint,
    setSharedHashSchema,
} from "../lib/helpers";

import "../assets/css/Editor.scss";

import "codemirror/addon/hint/show-hint.css";

class Editor extends React.Component {
    componentDidMount() {
        const { saveCodeMirrorInstance, url } = this.props;

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
        require("codemirror-graphql/hint");
        require("codemirror-graphql/lint");
        require("codemirror-graphql/info");
        require("codemirror-graphql/jump");
        require("codemirror-graphql/mode");

        let keywords = [];
        fetch(getEndpoint(url, "ui/keywords"), {
            method: "GET",
            mode: "cors",
            credentials: "same-origin",
        })
            .then(checkStatus)
            .then(response => response.json())
            .then(result => {
                keywords = keywords.concat(
                    result.keywords.map(kw => {
                        return kw.name;
                    }),
                );
            })
            .catch(error => {
                console.log(error.stack);
                console.warn(
                    "In catch: Error while trying to fetch list of keywords",
                    error,
                );
                return error;
            })
            .then(errorMsg => {
                if (errorMsg !== undefined) {
                    console.warn(
                        "Error while trying to fetch list of keywords",
                        errorMsg,
                    );
                }
            });

        let hasShareSchema = false;

        fetch(getEndpoint(url, "query"), {
            method: "POST",
            mode: "cors",
            body: "schema {}",
            credentials: "same-origin",
        })
            .then(checkStatus)
            .then(response => response.json())
            .then(result => {
                const data = result.data;
                if (data.schema && !_.isEmpty(data.schema)) {
                    keywords = keywords.concat(
                        data.schema.map(kw => {
                            if (kw.predicate === "_share_hash_") {
                                hasShareSchema = true;
                            }

                            return kw.predicate;
                        }),
                    );
                }
            })
            .catch(error => {
                console.log(error.stack);
                console.warn(
                    "In catch: Error while trying to fetch schema",
                    error,
                );
                return error;
            })
            .then(errorMsg => {
                if (errorMsg !== undefined) {
                    console.warn(
                        "Error while trying to fetch schema",
                        errorMsg,
                    );
                }
                if (!hasShareSchema) {
                    setSharedHashSchema(url)
                        .then(() => {
                            hasShareSchema = true;
                        })
                        .catch(() => {});
                }
            });

        this.editor = CodeMirror(this._editor, {
            value: this.props.query,
            lineNumbers: true,
            tabSize: 2,
            lineWrapping: true,
            mode: "graphql",
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
                    this.props.onRunQuery(this.getValue(), this.props.action);
                },
                "Ctrl-Enter": () => {
                    this.props.onRunQuery(this.getValue(), this.props.action);
                },
            },
            autofocus: true,
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
            const { onUpdateQuery } = this.props;
            if (!onUpdateQuery) {
                return;
            }

            const val = this.editor.getValue();
            onUpdateQuery(val);
        });

        this.editor.on("keydown", (cm, event) => {
            const code = event.keyCode;

            if (!event.ctrlKey && code >= 65 && code <= 90) {
                CodeMirror.commands.autocomplete(cm);
            }
        });

        if (saveCodeMirrorInstance) {
            saveCodeMirrorInstance(this.editor);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.query !== this.getValue()) {
            this.editor.setValue(nextProps.query);
        }
    }

    getValue = () => {
        return this.editor.getValue();
    };

    render() {
        return (
            <div
                className="Editor-basic"
                ref={editor => {
                    this._editor = editor;
                }}
            />
        );
    }
}

function mapStateToProps(state) {
    return {
        url: state.url,
    };
}

export default connect(mapStateToProps)(Editor);
