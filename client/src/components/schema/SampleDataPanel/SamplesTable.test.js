// Copyright 2017-2021 Dgraph Labs, Inc. and Contributors
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
import Enzyme from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { mount } from "enzyme";

import SamplesTable from "./SamplesTable";

Enzyme.configure({ adapter: new Adapter() });

test("SamplesTable shouldn't crash on scalars or nested objects", () => {
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
        <SamplesTable
            executeQuery={async function() {
                return {
                    data: {
                        samples,
                        nodeCount: [{ nodeCount: 10 }],
                    },
                };
            }}
            predicate={{ predicate: "foo" }}
        />,
    );
    wrapper.setState({ samples });
    // 4 properties - string, int, loc, arr
    expect(wrapper.find("tr").length).toEqual(4);
});
