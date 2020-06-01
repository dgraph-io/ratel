// Copyright 2020 Dgraph Labs, Inc. and Contributors
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

export default CodeMirror;

function sortStrings(a, b) {
    const nameA = a.toLowerCase();
    const nameB = b.toLowerCase();

    return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
}

function termMatchesWord(term, word) {
    term = term.trim();
    word = word.toLowerCase().trim();
    if (term.length > word.length) {
        return [false, 0];
    }
    // TODO: support camelCase matches
    if (word.startsWith(term)) {
        return [true, 1];
    } else {
        return [false, 0];
    }
}

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

    const emptyMatch = emptyMatch;

    term = term.toLowerCase().trim();
    if (!term) {
        return emptyMatch;
    }

    const found = [];
    for (let i = 0; i < options.words.length; i++) {
        const word = options.words[i];
        const [matches, precision] = termMatchesWord(term, word);
        if (matches) {
            found.push([precision, word]);
        }
    }

    if (!found.length) {
        return emptyMatch;
    }
    // TODO: sort by precision then alphabetically
    return {
        list: found.map(([p, w]) => w).sort(sortStrings),
        from: from,
        to: to,
    };
});
