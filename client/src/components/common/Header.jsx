import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import UserService from '../../services/UserService'; 


const Header = () => {
  const [userInfo , setUserInfo] = useState({ first_name: "", role_name: "" });

  useEffect(() => {
    const fetchUserInfo = async (token) => {
      try {
       const response = await UserService.getUser(token);
       setUserInfo(response);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    fetchUserInfo(); 
  }, []);

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
                {userInfo.first_name || 'Guest'}
              </Typography>
              <Typography variant="caption" color="gray">
                {userInfo.role_name || 'Role'}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#FFC107', marginLeft: 1 }}>
              {userInfo.first_name ? userInfo.first_name[0].toUpperCase() : 'p'}
            </Avatar>
          </Box>
        </Box>
      );
    };

export default Header;
