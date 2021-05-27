import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import Modal from '@material-ui/core/Modal';
import './BasicModal.scss';

export default function BasicModal(props) {

  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(props.modalOpen);
  }, [props.modalOpen])

  const handleClose = () => {
    setOpen(false);
    props.modalClose(false);
  };

  const onClickHandler = () => {
    if(props.rcvData){
      props.rcvData(props.sendData);
    }
    handleClose();
  }

  const body = (
    <div className={classNames('modal_wrapper', props.className)}>
      <div className="modal_header">
        <p>
          {props.title}
        </p>
        <div className="btnContainer">
          <button className="addBtn w-70px h-21px mr-5" onClick={onClickHandler}>{props.rcvData?"선택":"X"}</button>
          {props.activeCloseBtn && <button className="cancelBtn w-70px h-21px" onClick={handleClose}>X</button>}
        </div>
      </div>
      <div className="modal_body">
        {props.content}
      </div>
    </div>
  );

  return (
    <div>
      <Modal
        open={open}
        onClose={handleClose}
      >
        {body}
      </Modal>
    </div>
  );
}
