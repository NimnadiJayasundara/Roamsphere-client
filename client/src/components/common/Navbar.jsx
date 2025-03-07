import React, { useState } from "react";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Typography, Box } from "@mui/material";
import { Dashboard, DirectionsCar, EmojiEvents, AddCircle, Schedule, LocationOn, Settings } from "@mui/icons-material";
import MainLogo from '../../assets/MainLogo.jpg';

const menuItems = [
  { text: "Dashboard", icon: <Dashboard /> },
  { text: "Vehicle list", icon: <DirectionsCar /> },
  { text: "Driver Leaderboard", icon: <EmojiEvents />, active: true },
  { text: "Add new vehicle", icon: <AddCircle /> },
  { text: "Add new driver", icon: <AddCircle /> },
  { text: "Trip Schedule", icon: <Schedule /> },
  { text: "Track Location", icon: <LocationOn /> },
  { text: "Menu settings", icon: <Settings /> },
];

const Navbar = () => {
  const [selectedIndex, setSelectedIndex] = useState(2); // "Driver Leaderboard" is active

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 250,
        "& .MuiDrawer-paper": {
          width: 250,
          backgroundColor: "#111",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 2,
        },
      }}
    >
      {/* Logo */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <img src={MainLogo} alt="RoamSphere Logo" style={{ width: 100 }} />
        
      </Box>

      {/* Navigation Items */}
      <List sx={{ width: "100%", marginTop: 2 }}>
        {menuItems.map((item, index) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={index === selectedIndex}
              onClick={() => setSelectedIndex(index)}
              sx={{
                "&.Mui-selected": { backgroundColor: "#FF9800", color: "white" },
                "&:hover": { backgroundColor: "#333" },
              }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* logout */}
      <Box sx={{ marginTop: "auto", paddingBottom: 2, textAlign: "center" }}>
        <Avatar sx={{ bgcolor: "#FFC107", margin: "auto" }}>M</Avatar>
        <Typography variant="body2" sx={{ marginTop: 1 }}>
          Log out
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Navbar;