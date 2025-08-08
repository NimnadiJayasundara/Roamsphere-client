import React from 'react'
import { Box } from '@mui/material'
import Navbar from '../../components/common/Navbar'
import Header from '../../components/common/Header'

function TrackLocation() {
  return (
    <Box display="flex" height="100vh">
      <Navbar />
      <Box flexGrow={1} display="flex" flexDirection="column">
          <Header />
      </Box>
    </Box>
  )
}

export default TrackLocation
