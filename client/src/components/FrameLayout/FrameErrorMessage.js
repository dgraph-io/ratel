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

import React from "react";

export default function FrameErrorMessage({ error }) {
    return (
        <React.Fragment>
            <div className="text-content">
                <div>{`Error Name: ${error.name}`}</div>
                <br />
                <div>{`Message: ${error.message}`}</div>
                <br />
                <div>{`URL: ${error.url}`}</div>
                <br />
                <div>Raw Error:</div>
                <br />
                <pre>${JSON.stringify(error, null, 2)}</pre>
            </div>

            <div className="footer error-footer">
                <i className="fas fa-exclamation-triangle error-mark" />{" "}
                <span className="result-message">Error occurred</span>
            </div>
        </React.Fragment>
    );
}
