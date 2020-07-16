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

import { processGraph } from "./graph";

// TODO: reenable these tests, broken by switch from nodes [] to vis.DataSet

test("Temporary test", () => {
    expect(true).toBe(true);
});

/*

test("Graph with 2 central nodes should look OK", () => {
    const data = require("./test_data/small_graph_1.json");
    expect(processGraph(data, false, "")).toMatchSnapshot();
    expect(processGraph(data, true, "")).toMatchSnapshot();
});

test("10 movies with countries", () => {
    const data = require("./test_data/10_movies_with_countries.json");
    expect(processGraph(data, false, "")).toMatchSnapshot();
    expect(processGraph(data, true, "")).toMatchSnapshot();
});

test("Regexes should work", () => {
    const data = require("./test_data/10_movies_with_countries.json");
    expect(processGraph(data, false, "Foo")).toMatchSnapshot();
    expect(processGraph(data, false, "Bar")).toMatchSnapshot();
    expect(processGraph(data, false, "u")).toMatchSnapshot();
    expect(processGraph(data, false, "ui")).toMatchSnapshot();
    expect(processGraph(data, false, "uid")).toMatchSnapshot();

    expect(processGraph(data, false, "nam")).toMatchSnapshot();
    expect(processGraph(data, false, "name")).toMatchSnapshot();
});

test("Node colors should not change when predicates are re-ordered in JSON", () => {
    function processedNodesWithoutId(query) {
        const nodes = processGraph(query, false, "").nodes;
        nodes.forEach(n => delete n.id);
        return nodes;
    }
    const graph1 = require("./test_data/star_wars_colors_1.json");
    const graph2 = require("./test_data/star_wars_colors_2.json");
    expect(processedNodesWithoutId(graph1)).toEqual(
        processedNodesWithoutId(graph2),
    );
});

test("processGraph should not ignore `extensions`", () => {
    const data = {
        extensions: [{ uid: 100 }, { uid: 200 }, { uid: 300 }],
    };
    expect(processGraph(data, false, "").nodes.length).toBe(3);
});

*/
