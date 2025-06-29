import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import {
  Dashboard,
  DirectionsCar,
  EmojiEvents,
  AddCircle,
  Schedule,
  LocationOn,
  Settings,
  ChevronRight,
  ChevronLeft,
  RoundedCorner,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import MainLogo from "../../assets/logo2.png";

const drawerWidth = 280;

const Navbar = styled(Drawer, { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    width: open ? drawerWidth : 72,
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    "& .MuiDrawer-paper": {
      width: open ? drawerWidth : 72,
      height: "100vh",
      backgroundColor: "#111",
      color: "white",
      borderRadius: "0px 10px 10px 0px",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      overflowX: "visible",
      overflow: "visible",
      position: "relative",
      zIndex: 1201,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: 20,
    },
  })
);

const SidebarMenu = () => {
  const [open, setOpen] = useState(true);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const menuItems = [
    { text: "Dashboard", icon: <Dashboard /> },
    { text: "Vehicle list", icon: <DirectionsCar /> },
    { text: "Driver Leaderboard", icon: <EmojiEvents /> },
    { text: "Add new vehicle", icon: <AddCircle /> },
    { text: "Add new driver", icon: <AddCircle /> },
    { text: "Trip Schedule", icon: <Schedule /> },
    { text: "Track Location", icon: <LocationOn /> },
    { text: "Menu settings", icon: <Settings /> },
  ];

  return (
    <Navbar variant="permanent" open={open}>
    {/* Logo and Toggle Button */}
      <Box sx={{ position: "relative", width: "100%", mb: 2 }}>
        {open && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 5 }}>
            <img
              src={MainLogo}
              alt="RoamSphere Logo"
              style={{ width: 200, height: 80 }}
            />
          </Box>
        )}

        {/* Floating Toggle Button */}
        <Box
          onClick={toggleDrawer}
          sx={{
            position: "absolute",
            top: 25,
            right: -20,
            width: 35,
            height: 35,
            borderRadius: "50%",
            backgroundColor: "white",
            boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 1000,
            "&:hover": {
              backgroundColor: "#f5f5f5",
            },
          }}
        >
          {open ? (
            <ChevronLeft sx={{ color: "#000", fontSize: 20 }} />
          ) : (
            <ChevronRight sx={{ color: "#000", fontSize: 20 }} />
          )}
        </Box>
      </Box>

      <Divider />

      {/* Navigation Items */}
      <Box sx={{ mt: 5 }}>
      <List>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton 
              sx={{ 
                    justifyContent: open ? "initial" : "center", 
                    px: 2.5,
                    "&:hover": {
                      backgroundColor: "white",
                      color: "orange",
                      borderRadius: "30px",
                      "& .MuiListItemIcon-root, & .MuiListItemText-root": {
                      color: "orange",
                      borderRadius: "20px",
                    },
                    },
                     }}>
              <ListItemIcon 
                sx={{ 
                      minWidth: 0, 
                      mr: open ? 1 : -18, 
                      justifyContent: "center",
                      color: "white",
                      }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      </Box>

      {/* Logout Section */}
      <Box sx={{ marginTop: "auto", paddingBottom: 2, textAlign: "center" }}>
        <Avatar sx={{ bgcolor: "#FFC107", margin: "auto" }}>M</Avatar>
        <Typography variant="body2" sx={{ marginTop: 1 }}>
          Log out
        </Typography>
      </Box>
    </Navbar>
  );
};

export default SidebarMenu;
