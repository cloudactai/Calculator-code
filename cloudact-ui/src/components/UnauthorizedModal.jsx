import React from 'react';
import { Modal, Button } from 'react-bootstrap'; // or your preferred UI library

const UnauthorizedModal = ({ show, handleClose, handleConfirm, handleCancel }) => {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Unauthorized Access</Modal.Title>
      </Modal.Header>
      <Modal.Body>Your session has expired or you are not authorized to access this resource. Please log in again.</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UnauthorizedModal;
