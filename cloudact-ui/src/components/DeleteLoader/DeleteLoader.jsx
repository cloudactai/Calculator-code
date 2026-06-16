import { useEffect } from "react";
import "./deleteloader.css"
import Modal from 'react-bootstrap/Modal';
import React from 'react';

function DeleteLoaderParent(props) {
  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      className="deleteLoaderModal"
      centered
    >

      <Modal.Body>
      <div class="cont">
  <div class="paper"></div>
  <button><div class='deleteloader'>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    </div>Deleting</button>
  <div class="g-cont">
    <div class="garbage"></div>
    <div class="garbage"></div>
    <div class="garbage"></div>
    <div class="garbage"></div>
    <div class="garbage"></div>
    <div class="garbage"></div>
    <div class="garbage"></div>
    <div class="garbage"></div>
  </div>
</div>
      </Modal.Body>
    </Modal>
  );
}

function DeleteLoader({ isLoading }) {
    return (
      <DeleteLoaderParent
        show={isLoading}
        onHide={() => {}}
      />
    );
  }
  
  export default DeleteLoader;