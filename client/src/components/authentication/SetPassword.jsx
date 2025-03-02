import React, { useState } from "react";
import { Box, Typography, TextField, Button, Paper, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import MainLogo from "../../assets/MainLogo.jpg";

const SetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!/^(?=.*[0-9])(?=.*[!@#$%^&*])/.test(password)) {
      setError("Password must contain at least one number and one special character.");
      return;
    }
    setError("");
    alert("Password set successfully!");
  };

  return (
    <Box display="flex" height="100vh">
      {/* Left Side - Logo Section */}
      <Box
        flex={3}
        sx={{
          backgroundColor: "#000000",
          backgroundImage: `url(${MainLogo})`,
          backgroundSize: "50%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />

      {/* Right Section - Form */}
      <Paper
        elevation={6}
        sx={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 4,
          width: '80%'
        }}
      >
        <Typography variant="h4" sx={{ color: "#072227", fontWeight: "bold" }}>
          Set password
        </Typography>
        <Typography sx={{ mt: 4, mb: 2, color: "lightgray" }}>
          Set your password
        </Typography>

        <TextField
          label="Enter Your Password"
          variant="outlined"
          type={showPassword ? "text" : "password"}
          fullWidth
          sx={{ mt: 4, width: '80%' }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleTogglePasswordVisibility}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Confirm Password"
          variant="outlined"
          type={showPassword ? "text" : "password"}
          fullWidth
          sx={{ mt: 2, width: '80%' }}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleTogglePasswordVisibility}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          helperText="At least 1 number or a special character"
        />

        {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 7, backgroundColor: "#fbc02d", fontWeight: "bold", width: '80%' }}
          onClick={handleSubmit}
        >
          Register
        </Button>
      </Paper>
    </Box>
  );
};

export default SetPassword;
