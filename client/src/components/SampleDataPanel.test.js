import React from "react";
import Enzyme from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { mount } from "enzyme";

import SampleDataPanel from "./SampleDataPanel";

Enzyme.configure({ adapter: new Adapter() });

test("SampleDataPanel shouldn't crash on scalars or nested objects", () => {
    const samples = [
        {
            uid: 333,
            stringVal: "s",
            intVal: 100,
            loc: { type: "Point", coords: [1, 2, 3] },
            arr: [{ uid: 1 }, { uid: 2 }],
        },
    ];
    const wrapper = mount(
        <SampleDataPanel
            executeQuery={async function() {
                return {
                    data: {
                        samples,
                        nodeCount: [{ nodeCount: 10 }],
                        stats: [{ avgCount: 1, totalCount: 10 }],
                    },
                };
            }}
            predicate={{ predicate: "foo" }}
        />,
    );
    wrapper.setState({ samples });
    // 6 = uid row + 4 properties + spacer
    expect(wrapper.find("tr").length).toEqual(6);
});
