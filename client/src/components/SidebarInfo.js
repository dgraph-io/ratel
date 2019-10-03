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

export default function SidebarInfo() {
    return (
        <div className="sidebar-help">
            <section>
                <h4>Dgraph Ratel</h4>

                <p>An interface to easily query and visualize your data</p>
                <ul className="list-unstyled">
                    <li>
                        <a
                            href="https://github.com/dgraph-io/ratel"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="fab fa-github link-icon" />
                            Ratel on Github
                        </a>
                    </li>
                </ul>
                <ul className="list-unstyled">
                    <li>
                        <a
                            href="https://sung8.typeform.com/to/CTeDKi"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="far fa-envelope-open link-icon" />
                            Write a short feedback
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://github.com/dgraph-io/ratel/issues/new"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="fas fa-bug link-icon" />
                            File a GitHub issue
                        </a>
                    </li>
                </ul>
            </section>

            <section>
                <h3>Dgraph</h3>

                <p>Fast, distributed graph database</p>

                <ul className="list-unstyled">
                    <li>
                        <a
                            href="https://docs.dgraph.io"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="fas fa-book link-icon" />
                            Documentation
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://discuss.dgraph.io"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="fab fa-discourse link-icon" />
                            Discussion forum
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://slack.dgraph.io"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="fab fa-slack link-icon" />
                            Slack group
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://tour.dgraph.io"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="fas fa-atlas link-icon" />A tour of
                            Dgraph
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://github.com/dgraph-io/dgraph"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="fab fa-github link-icon" />
                            Dgraph on GitHub
                        </a>
                    </li>
                </ul>
            </section>

            <p style={{ fontSize: "0.5em" }}>
                Built at {process.env.RATEL_BUILT_AT}
                <br />
                Commit: {process.env.RATEL_COMMIT_ID}
                <br />
                Commit Info: {process.env.RATEL_COMMIT_INFO}
                <br />
            </p>

            <p className="who-made-this">
                <i className="fa fa-bolt" />
                <span className="who">
                    Made by
                    <a
                        href="https://dgraph.io/about.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="team-link"
                    >
                        Dgraph team
                    </a>
                </span>
                <i className="fa fa-bolt" />
            </p>
        </div>
    );
}
