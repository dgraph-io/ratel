/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

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
        return [component(0), component(1), component(2), alpha];
    };
}
