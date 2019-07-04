import React from "react";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

import jwt from "jsonwebtoken";

export default function SidebarLoginControl({ onLogin, onLogout, urlState }) {
    const { accessToken, loginError, loginPending } = urlState;

    const [userid, setUserid] = React.useState("groot");
    const [password, setPassword] = React.useState("");

    const loggedIn = accessToken && !!jwt.decode(accessToken);

    const renderForm = () => (
        <React.Fragment>
            <div className="form-group">
                <label htmlFor="useridInput">Userid:</label>
                <input
                    id="useridInput"
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
            </div>
            <div className="form-group">
                <label htmlFor="passwordInput">Password:</label>
                <input
                    id="passwordInput"
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
            </div>
            <Button
                variant="primary"
                onClick={() => onLogin(userid, password)}
                disabled={loginPending || !userid.trim()}
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
                    placement="top"
                    overlay={
                        <Tooltip id="tooltip">
                            {loginError.errors[0].message}
                        </Tooltip>
                    }
                >
                    <span className="error">
                        {/* This is terrible but going to be redesigned soon. */}
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <i className="fas fa-exclamation-triangle" /> Error
                    </span>
                </OverlayTrigger>
            )}
        </React.Fragment>
    );

    const renderLoginState = () => {
        const accessJwt = jwt.decode(accessToken);
        if (!accessJwt) {
            return null;
        }
        return (
            <React.Fragment>
                <span>Logged in as {JSON.stringify(accessJwt.userid)} </span>
                <Button variant="danger" onClick={() => onLogout()} size="xs">
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
