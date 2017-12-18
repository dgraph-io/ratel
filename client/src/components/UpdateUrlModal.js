import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';

export default class UpdateUrlModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            urlString: props.urlString || '',
            show: false,
            showError: false
        };
    }

    open = () => {
        this.setState({ show: true });
    }

    close = () => {
        this.setState({ show: false });
    }

    handleUrlTextUpdate = (event) => {
        const value = event.target.value;
        const urlString = value.trim();
        if (urlString) {
            if (this.state.showError) {
                this.setState({ showError: false });
            }
        } else {
            if (this.state.urlString.trim()) {
                this.setState({ showError: true });
            }
        }
        this.setState({ urlString: value });
    }

    handleSubmit = () => {
        const { onSubmit } = this.props;
        const urlString = this.state.urlString.trim();
        if (urlString) {
            this.close();
            onSubmit && onSubmit(this.state.urlString.trim());
        } else {
            this.setState({ showError: true });
        }
    }

    handleCancel = () => {
        const { onCancel } = this.props;
        this.close();
        onCancel && onCancel();
    }

    handleKeyPress = (event) => {
        if(event.key === 'Enter'){
            this.handleSubmit();
        }
    }

    render() {
        return <Modal show={this.state.show} onHide={this.handleCancel}>
            <Modal.Header closeButton>
                <Modal.Title>Update URL</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h4>Enter Dgraph server URL:</h4>
                <div style={{
                    margin: "15px 0"
                }}>
                    <input
                        type="text"
                        placeholder="ex. localhost:8080"
                        value={this.state.urlString}
                        onChange={this.handleUrlTextUpdate}
                        onKeyPress={this.handleKeyPress}
                        style={{
                            padding: "5px 8px",
                            width: "100%",
                            fontSize: "1.08em"
                        }}
                    />
                    {this.state.showError ? <p style={{ color: "#dc3545", marginTop: "5px" }}>The URL field cannot be empty</p> : null}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={this.handleCancel}>Cancel</Button>
                <Button bsStyle="primary" onClick={this.handleSubmit} disabled={!(this.state.urlString.trim())}>Update</Button>
            </Modal.Footer>
        </Modal>;
    }
}
