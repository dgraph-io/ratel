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
