import React from "react";
import Button from "react-bootstrap/lib/Button";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import FormGroup from "react-bootstrap/lib/FormGroup";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import Modal from "react-bootstrap/lib/Modal";

export default class SchemaDropAllModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            inputValue: "",
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

    isLocked = () => this.state.inputValue.trim() !== "DROP ALL";

    render() {
        const { loading, errorMsg } = this.state;
        const { onCancel } = this.props;

        const icon = (
            <i
                className={"fas " + (this.isLocked() ? "fa-lock" : "fa-unlock")}
            />
        );

        return (
            <Modal show={true} onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>Drop All</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete all of your data including
                    the schema? You <em>will not</em> be able to restore your
                    data once it has been deleted.
                    <FormGroup controlId="formTypeToConfirm">
                        <HelpBlock>
                            To proceed, please type "DROP ALL" in the text field
                            below.
                        </HelpBlock>
                        <FormControl
                            type="text"
                            placeholder="Type DROP ALL here"
                            onChange={({ target: { value: inputValue } }) =>
                                this.setState({ inputValue })
                            }
                            value={this.state.inputValue}
                        />
                    </FormGroup>
                    {!errorMsg ? null : (
                        <div className="alert alert-danger">{errorMsg}</div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button
                        bsStyle="danger"
                        disabled={loading || this.isLocked()}
                        onClick={() => this.handleDropAll()}
                    >
                        {icon}
                        &nbsp;
                        {loading ? "Dropping All..." : "Drop All"}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
