/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react"
import Form from "react-bootstrap/Form"
import { useDispatch, useSelector } from "react-redux"

import { updateZeroUrl } from "actions/connection"

export default function ZeroUrlWidget() {
    const currentServer = useSelector((state) => state.connection.serverHistory[0])
    const dispatch = useDispatch()

    const [zeroUrl, setZeroUrl] = useState(currentServer.zeroUrl)

    return (
        <Form onSubmit={(e) => e.preventDefault()}>
            <Form.Group controlId="zeroUrl">
                <Form.Label>Dgraph Zero URL:</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="http://myzero:6080"
                    value={zeroUrl}
                    onChange={(e) => {
                        dispatch(updateZeroUrl(zeroUrl))
                        setZeroUrl(e.target.value)
                    }}
                    style={{
                        width: "100%",
                    }}
                />
            </Form.Group>
        </Form>
    )
}
