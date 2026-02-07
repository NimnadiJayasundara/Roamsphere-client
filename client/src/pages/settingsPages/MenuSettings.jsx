import React, { useState } from 'react'
import { Box, Paper, Typography, Divider, Button, Stack, TextField } from '@mui/material';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';

function MenuSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setPasswordError('');
    // Placeholder: Call API to change password
    console.log('Changing password...');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <Box display="flex">
      <Navbar />
      <Box flexGrow={1}>
        <Header />
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>Settings</Typography>
          <Paper sx={{ p: 3 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Change Password</Typography>
              <Stack spacing={2} sx={{ maxWidth: 400 }}>
                <TextField
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  fullWidth
                  size="small"
                  error={!!passwordError}
                  helperText={passwordError}
                />
                <Button
                  variant="outlined"
                  onClick={handleChangePassword}
                  sx={{ borderColor: '#FDCB42', color: '#FDCB42', '&:hover': { backgroundColor: '#FDCB42', color: 'white' } }}
                >
                  Change Password
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}

export default MenuSettings
