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
import jwt from "jsonwebtoken";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { useDispatch, useSelector } from "react-redux";

import { loginUser, logoutUser } from "actions/connection";
import { Fetching } from "lib/constants";

export default function ServerLoginWidget() {
    const currentServer = useSelector(
        state => state.connection.serverHistory[0],
    );
    const dispatch = useDispatch();

    const token = currentServer.refreshToken;
    const jwtUserid = jwt.decode(token)?.userid;
    const loggedIn = token && jwtUserid;
    const [userid, setUserid] = React.useState(jwtUserid || "groot");
    const [password, setPassword] = React.useState("");
    const [namespace, setNamespace] = React.useState(0);

    const loginPending = currentServer.loginStatus === Fetching;
    const loginError = currentServer.loginError;

    const onLogin = (userid, password, namespace, refreshToken) => {
        dispatch(loginUser(userid, password, Number(namespace), refreshToken));
        setPassword("");
    };

    const onLogout = () => dispatch(logoutUser());

    const renderForm = () => (
        <Form
            onSubmit={e => {
                e.preventDefault();
                onLogin(userid, password);
            }}
        >
            <Form.Group controlId="useridInput">
                <Form.Label>Userid:</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="<userid>"
                    value={userid}
                    onChange={e => setUserid(e.target.value)}
                    style={{
                        padding: "5px 8px",
                        width: "100%",
                        color: "black",
                    }}
                />
            </Form.Group>
            <Form.Group controlId="passwordInput">
                <Form.Label>Password:</Form.Label>
                <Form.Control
                    type="password"
                    placeholder="<password>"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                        padding: "5px 8px",
                        width: "100%",
                        color: "black",
                    }}
                />
            </Form.Group>
            <Form.Group controlId="namespaceInput">
                <Form.Label>Namespace:</Form.Label>
                <Form.Control
                    type="number"
                    placeholder="namespace"
                    value={namespace}
                    onChange={e => setNamespace(e.target.value)}
                    style={{
                        padding: "5px 8px",
                        marginBottom: "16px",
                        width: "100%",
                        color: "black",
                    }}
                />
            </Form.Group>
            <Button
                disabled={loginPending || !userid.trim()}
                variant="primary"
                onClick={() => onLogin(userid, password, namespace)}
                type="submit"
            >
                {loginPending ? (
                    <span style={{ position: "relative" }}>
                        <i
                            className="fas fa-spinner fa-pulse"
                            style={{ position: "absolute", display: "block" }}
                        />
                        <span style={{ opacity: 0 }}>Login</span>
                    </span>
                ) : (
                    <span>Login</span>
                )}
            </Button>
            {!loginError || loginPending ? null : (
                <OverlayTrigger
                    placement="right"
                    overlay={
                        <Tooltip id="tooltip">
                            {loginError?.errors?.[0]?.message ||
                                loginError?.message ||
                                JSON.stringify(loginError)}
                        </Tooltip>
                    }
                >
                    <span
                        className="error"
                        style={{
                            borderBottom: "1px solid red",
                            marginLeft: 8,
                            display: "inline-block",
                        }}
                    >
                        <i className="fas fa-exclamation-triangle" /> Error
                    </span>
                </OverlayTrigger>
            )}
        </Form>
    );

    const renderLoginState = () => {
        return (
            <React.Fragment>
                <p>
                    Logged in as <strong>{jwtUserid}</strong>
                </p>
                <Button
                    variant="secondary"
                    onClick={() => onLogout()}
                    size="sm"
                >
                    Logout
                </Button>
            </React.Fragment>
        );
    };

    if (!loggedIn) {
        return renderForm();
    } else {
        return renderLoginState();
    }
}
