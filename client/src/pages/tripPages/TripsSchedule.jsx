import React from 'react'
import { Box } from '@mui/material';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';

function TripsSchedule() {
  return (
    <Box display="flex">
      <Navbar />
      <Box flexGrow={1}>
        <Header />
        <h1>Trips Schedule</h1>
      </Box>
    </Box>
  )
}

export default TripsSchedule
