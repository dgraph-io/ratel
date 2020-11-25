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
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";

export default function RadioSelect({
    value,
    onChange,
    radioItems,
    itemLabels,
}) {
    return (
        <React.Fragment>
            {radioItems.map((item, index) => (
                <Col sm={12} key={"radio-" + item}>
                    <Form.Check
                        type="radio"
                        checked={item === value}
                        id={"radio-" + item}
                        label={(itemLabels && itemLabels[index]) || item}
                        onChange={() => onChange(item)}
                    />
                </Col>
            ))}
        </React.Fragment>
    );
}
