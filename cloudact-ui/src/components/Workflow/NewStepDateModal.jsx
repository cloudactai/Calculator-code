import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Box, TextField ,Typography} from '@mui/material';

export default function NewStepDateModal({open, initialValue, handleOnSave, handleOnClose}) {
    const [interval, setInterval] = React.useState(initialValue);
  const handleSaveClick = () => {
    handleOnSave(interval)
    handleClose();
  };

  const handleUpdate = (e)=>{
    setInterval(e.target.value??0)
  }

  const handleClose = () => {
    handleOnClose(false);
  };

  return (
    <React.Fragment>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Set due date for this new step."}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <Box sx={{display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center'}}>
                <Typography>Number of working days from previous step's due date?</Typography>
                <TextField value={interval} onChange={handleUpdate} variant='outlined' size='sm' sx={{padding: 0}} />
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveClick} autoFocus>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
