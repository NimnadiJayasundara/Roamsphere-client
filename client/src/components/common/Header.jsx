import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import UserService from '../../services/UserService'; 

const Header = () => {
  const [userInfo, setUserInfo] = useState({ 
    first_name: "", 
    last_name: "", 
    role_name: "",
    image_url: "" 
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Get email from localStorage
        const email = localStorage.getItem("userEmail");
        
        if (!email) {
          console.error('No user email found in localStorage');
          return;
        }

        // First, get basic user info
        const userData = await UserService.findUserByEmail(email);
        
        if (userData && userData.exists) {
          setUserInfo(prev => ({
            ...prev,
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            role_name: userData.role_name || ""
          }));

          // If user is a driver, try to get driver profile for image
          if (userData.role_name === 'driver') {
            try {
              const driverProfile = await UserService.getDriverProfileByEmail(email);
              if (driverProfile && driverProfile.image_url) {
                setUserInfo(prev => ({
                  ...prev,
                  image_url: driverProfile.image_url
                }));
              }
            } catch (driverError) {
              console.log('No driver profile found or error fetching driver image');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo(); 
  }, []);

  const fullName = `${userInfo.first_name} ${userInfo.last_name}`.trim();
  const displayName = fullName || 'Guest';
  const avatarLetter = userInfo.first_name ? userInfo.first_name[0].toUpperCase() : 'G';

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
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" sx={{ fontWeight: '600' }}>
            {displayName}
          </Typography>
          <Typography variant="caption" color="gray">
            {userInfo.role_name || 'Role'}
          </Typography>
        </Box>
        <Avatar 
          sx={{ bgcolor: '#FFC107', marginLeft: 1, width: 40, height: 40 }}
          src={userInfo.image_url || undefined}
        >
          {!userInfo.image_url && avatarLetter}
        </Avatar>
      </Box>
    </Box>
  );
};

export default Header;