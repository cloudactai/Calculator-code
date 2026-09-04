import React from 'react';
import { Modal, Button } from 'react-bootstrap'; // or your preferred UI library

// Shown only when a request that carried a token was rejected — i.e. the user
// had a session and it expired. Sessions last 24h and nothing renews them, so
// anyone who leaves a tab open overnight lands here. Before this, that state
// was silent and surfaced only as whatever the failing page happened to say,
// e.g. "Could not load this form's PDF" on every form in every province.
const UnauthorizedModal = ({ show, handleClose, handleConfirm, handleCancel }) => {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Your session has expired</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-2">
          You have been signed out because your session timed out. This is why
          pages have stopped loading — it is not a problem with your matter or
          your forms.
        </p>
        <p className="mb-0 text-muted">
          Sign in again to pick up where you left off. If you have unsaved
          changes on this page, copy them somewhere safe first — signing in
          reloads the page.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancel}>
          Not now
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          Sign in again
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UnauthorizedModal;
