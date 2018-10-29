import React from "react";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";

import Editor from "../containers/Editor";
import { getRawSchema } from "../lib/dgraph-syntax";

export default class SchemaRawModeModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            value: getRawSchema(this.props.schema),
            editorKey: 1,
        };

        this.handleUpdate = this.handleUpdate.bind(this);
    }

    async handleUpdate() {
        const { executeQuery, onAfterUpdate } = this.props;

        this.setState({
            errorMsg: "",
            updating: true,
        });

        try {
            await executeQuery(this.state.value, "alter", true);
            onAfterUpdate();
        } catch (errorMessage) {
            this.setState({
                errorMsg: `Could not alter schema: ${errorMessage}`,
            });
        } finally {
            this.setState({ updating: false });
        }
    }

    handleResetClick = () => {
        this.setState({
            value: getRawSchema(this.props.schema),
            editorKey: this.state.editorKey + 1,
        });
    };

    render() {
        const { onCancel } = this.props;
        const { editorKey, updating, errorMsg } = this.state;

        return (
            <Modal show={true} onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Schema File</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Editor
                        key={editorKey}
                        query={this.state.value}
                        maxHeight={328}
                        onUpdateQuery={value => this.setState({ value })}
                    />
                    {!errorMsg ? null : (
                        <div className="alert alert-danger">{errorMsg}</div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button className="pull-left" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        className="pull-left"
                        bsStyle="default"
                        onClick={this.handleResetClick}
                        disabled={updating}
                    >
                        {updating ? "Updating..." : "Show Server Schema"}
                    </Button>
                    <Button
                        bsStyle="primary"
                        onClick={this.handleUpdate}
                        disabled={updating}
                    >
                        {updating ? "Updating..." : "Apply Schema"}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
