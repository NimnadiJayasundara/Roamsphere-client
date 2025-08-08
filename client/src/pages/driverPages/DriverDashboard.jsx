import React from 'react'
import { Box } from '@mui/material';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';

function DriverDashboard() {
  return (
    <Box display="flex">
      <Navbar />
      <Box flexGrow={1}>
        <Header />
      </Box>
    </Box>
  )
}

export default DriverDashboard
