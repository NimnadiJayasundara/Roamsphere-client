// HeaderBar.js
import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

const Header = () => {
    return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            backgroundColor: '#fff',
            paddingX: 2,
            borderBottom: '1px solid #E0E0E0',
          }}
        >
          {/* Left side: path */}
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}></Typography>
    
          {/* Right side: User Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}> 
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: '600' }}>
                Hansi
              </Typography>
              <Typography variant="caption" color="gray">
                Admin
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#FFC107', marginLeft: 1 }}>M</Avatar>
          </Box>
        </Box>
      );
    };

export default Header;
