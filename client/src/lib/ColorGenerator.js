// Copyright 2017-2020 Dgraph Labs, Inc. and Contributors
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

import randomColor from "randomcolor";

export default class ColorGenerator {
    // Picked up from http://graphicdesign.stackexchange.com/questions/3682/where-can-i-find-a-large-palette-set-of-contrasting-colors-for-coloring-many-d.
    randomColorList = [
        "#47c0ee",
        "#8dd593",
        "#f6c4e1",
        "#8595e1",
        "#f0b98d",
        "#f79cd4",
        "#bec1d4",
        "#11c638",
        "#b5bbe3",
        "#7d87b9",
        "#e07b91",
        "#4a6fe3",
    ];

    get = () => this.randomColorList.shift() || randomColor();

    getRGBA = (alpha = 1) => {
        const col = this.get();
        const component = idx =>
            parseInt(col.substring(1 + idx * 2, 3 + idx * 2), 16);
        const res = [component(0), component(1), component(2), alpha];
        console.log(col, "->", res);
        return res;
    };
}
