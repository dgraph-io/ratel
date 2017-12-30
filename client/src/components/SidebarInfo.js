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
                            <i className="fa fa-external-link link-icon" />
                            Documentation
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://discuss.dgraph.io"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="fa fa-external-link link-icon" />
                            Discussion forum
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://slack.dgraph.io"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="fa fa-external-link link-icon" />
                            Slack group
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://tour.dgraph.io"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="fa fa-external-link link-icon" />
                            A tour of Dgraph
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://github.com/dgraph-io/dgraph"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="fa fa-external-link link-icon" />
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
                        <i className="fa fa-external-link link-icon" />
                        View on Github
                    </a>
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
