import React from "react";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";

export default class SchemaDropAllModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            errorMsg: "",
        };
    }

    async handleDropAll() {
        const { executeQuery, onAfterDropAll } = this.props;
        this.setState({
            loading: true,
            errorMsg: "",
        });

        try {
            await executeQuery(
                JSON.stringify({ drop_all: true }),
                "alter",
                true,
            );
            onAfterDropAll();
        } catch (errorMessage) {
            this.setState({
                errorMsg: `Could not drop all: ${errorMessage}`,
            });
        } finally {
            this.setState({ loading: false });
        }
    }

    render() {
        const { loading, errorMsg } = this.state;
        const { onCancel } = this.props;

        return (
            <Modal show={true} onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>Drop All</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete all of your data including
                    the schema? You <em>will not</em> be able to restore your
                    data once it has been deleted.
                    {!errorMsg ? null : (
                        <div className="alert alert-danger">{errorMsg}</div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button
                        bsStyle="danger"
                        disabled={loading}
                        onClick={() => this.handleDropAll()}
                    >
                        {loading ? "Dropping All..." : "Drop All"}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
