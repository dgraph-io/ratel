import { processGraph } from "./graph";

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
    const graph1 = require("./test_data/star_wars_colors_1.json");
    const graph2 = require("./test_data/star_wars_colors_1.json");
    expect(processGraph(graph1, false, "")).toEqual(
        processGraph(graph2, false, ""),
    );
});

test("processGraph should not ignore `extensions`", () => {
    const data = {
        extensions: [{ uid: 100 }, { uid: 200 }, { uid: 300 }],
    };
    expect(processGraph(data, false, "").nodes.length).toBe(3);
});
