import React from "react";

export default function SidebarInfo() {
    return (
        <div className="sidebar-help">
            <h2>Dgraph</h2>

            <p>Fast, distributed graph database</p>

            <section>
                <h3>Where to find help</h3>

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
                            GitHub
                        </a>
                    </li>
                </ul>
            </section>

            <section>
                <h3>About Dgraph Browser</h3>

                <p>An interface to easily query and visualize your data.</p>
                <p>
                    <a
                        href="https://github.com/dgraph-io/dgraph/tree/master/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <i className="fab fa-github link-icon" />
                        View on Github
                    </a>
                </p>
                <p style={{ fontSize: "0.75em", backgroundColor: "#3c3c3" }}>
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
            </section>
        </div>
    );
}
