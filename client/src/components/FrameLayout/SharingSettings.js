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

import React, { useCallback, useEffect, useRef, useState } from "react";
import Form from "react-bootstrap/Form";
import { useSelector } from "react-redux";

import "./SharingSettings.scss";

const PLAY_DOMAIN = "https://play.dgraph.io";

export default function SharingSettings({ title, query }) {
    const [isPlay, setIsPlay] = useState(true);
    const [includeAddr, setIncludeAddr] = useState(false);
    const inputEl = useRef(null);

    const [showCopied, setShowCopied] = useState(false);
    const [showCopyError, setShowCopyError] = useState(false);

    useEffect(() => {
        if (!inputEl.current) {
            return;
        }
        inputEl.current.focus();
        inputEl.current.select();
    }, [isPlay, includeAddr, inputEl]);

    const serverAddr = useSelector(
        state => state.connection?.serverHistory?.[0]?.url,
    );

    const serverAddrPart = !includeAddr
        ? ""
        : `&addr=${encodeURIComponent(serverAddr)}`;

    const url = `${
        isPlay ? PLAY_DOMAIN : window.location.origin
    }?query=${encodeURIComponent(query)}${serverAddrPart}`;

    const onCopyToClipboard = useCallback(() => {
        navigator.clipboard.writeText(url).then(
            () => {
                setShowCopied(true);
                setTimeout(() => setShowCopied(false), 750);
            },
            () => {
                setShowCopyError(true);
                setTimeout(() => setShowCopyError(false), 750);
            },
        );
    }, [url]);

    return (
        <div className="sharingSettings">
            <Form.Group controlId="frameUrlText" className="urlRow">
                <Form.Control
                    type="text"
                    ref={inputEl}
                    placeholder="https://dgraph.example.com:port"
                    style={{ width: "100%" }}
                    value={url}
                    onChange={() => 0}
                />
                <button
                    className="btnCopy"
                    onClick={onCopyToClipboard}
                    title="Copy to Clipboard"
                >
                    {showCopied ? (
                        "Copied!"
                    ) : showCopyError ? (
                        "Error!"
                    ) : (
                        <i className="fas fa-copy" />
                    )}
                </button>
            </Form.Group>

            <Form.Group>
                <Form.Label>Ratel Domain:</Form.Label>
                <Form.Check
                    type="radio"
                    label={PLAY_DOMAIN}
                    checked={isPlay}
                    onChange={() => setIsPlay(true)}
                />
                <Form.Check
                    type="radio"
                    label={window.location.origin}
                    checked={!isPlay}
                    onChange={() => setIsPlay(false)}
                />
            </Form.Group>
            <Form.Group className="includeAddr">
                <Form.Check
                    type="checkbox"
                    label="Include Alpha address"
                    checked={includeAddr}
                    onChange={() => setIncludeAddr(!includeAddr)}
                />
            </Form.Group>
        </div>
    );
}
