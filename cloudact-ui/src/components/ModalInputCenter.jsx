import React from "react";
import { Modal } from "react-bootstrap";

interface IModalInputCenter{
  heading: String,
  children: React.ReactChildren,
  handleClick: (e) => void,
  action: String,
  show: Boolean,
  changeShow: (e) => void,
  cancelOption?: String,
  size? : String
}

const ModalInputCenter = ({
  heading,
  children,
  handleClick,
  action,
  show,
  changeShow,
  cancelOption,
  ResetOption,
  size,
  modalSize,
  optionalWidth,
  reset,
  resetAll
}) => {
  return (
    <Modal  show={show} keyboard={true} onHide={changeShow} size={size | 'md'} dialogClassName={`customModal ${optionalWidth ? "modalWidth" : ""} ${modalSize}`} aria-labelledby="contained-modal-title-vcenter" centered rounded={true}>
      <Modal.Header closeButton={true} closeVariant={"white"}>
        <Modal.Title id="contained-modal-title-vcenter">
          {heading}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        {action && (<button className="btn btnPrimary blue" onClick={handleClick}>{action}</button>)}
        {
          reset &&
        <button className="btn btnDefault" onClick={resetAll}>{ResetOption ? ResetOption : "Reset"}</button>

        }
        <button className="btn btnDefault" onClick={changeShow}>{cancelOption ? cancelOption : "Cancel"}</button>
       

      </Modal.Footer>
    </Modal>
  );
};

export default ModalInputCenter;
