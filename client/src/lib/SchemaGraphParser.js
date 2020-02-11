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

import { GraphParser } from "./graph";

export default class SchemaGraphParser extends GraphParser {
    addResponseToQueue(data) {
        if (data.schema) {
            data.schema.forEach(p => {
                p.uid = p.name = p.predicate;
            });
        }

        if (data.types) {
            data.types.forEach(type => {
                type.fields.forEach(f => {
                    f.uid = f.name;
                });
            });
        }

        return super.addResponseToQueue(data);
    }
}
