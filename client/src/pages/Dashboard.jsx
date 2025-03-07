import React, { useState, useEffect } from "react";
import axios from 'axios';
import { Box, Container, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from "@mui/material";
import { API_URL } from "../config";
import UserService from "../services/UserService"; 
import AuthService from "../services/AuthServices";
import Navbar from "../components/common/Navbar";
import Header from "../components/common/Header";
 

const Dashboard = () => {
  const [users, setUsers] = useState([]);  // Initialize with an empty array
  const [open, setOpen] = useState(false);
  const [newUser, setNewUser] = useState({ first_name: "", last_name: "", email: "", role_name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchingUsers, setFetchingUsers] = useState(true); // To manage the loading state while fetching users
  const [message, setMessage] = useState(''); // For displaying success/error messages

  useEffect(() => {
    // Fetch all users when the component mounts
    const fetchUsers = async () => {
      try {
        const response = await UserService.getAllUsers(); // Fetch users from the backend
        setUsers(response);  // Update the users state with the response data
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users");
      } finally {
        setFetchingUsers(false); // Stop loading after fetch
      }
    };

    fetchUsers(); // Call the function to fetch users
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const findUserByEmail = async (email) => {
    try {
      const response = await UserService.findUserByEmail(email);
      return response.message === "User already exists.";
    } catch (error) {
      console.error("Error checking user existence:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(""); // Reset error state

    const userExists = await findUserByEmail(newUser.email);
    if (userExists) {
      setError("A user with this email already exists.");
      setLoading(false);
      return;
    }

    // Create a new user
    try {
      const tempPassword = Math.random().toString(36).slice(-8); // Generate a temporary password
      const response = await axios.post(`${API_URL}/createprofile`, {
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        email: newUser.email,
        role: newUser.role_name,
        password: tempPassword // Send the temporary password
      });

      // Send an email with the temporary password
      await AuthService.sendInvitationEmail(newUser.email, `Your temporary password is: ${tempPassword}`);
      setMessage("User created successfully.");
      setMessage(response.data.message);  // Display success message
      setUsers([...users, { ...newUser, id: users.length + 1 }]); // Add user to the list
      setNewUser({ first_name: "", last_name: "", email: "", role_name: "" }); // Reset fields
      handleClose();
    } catch (error) {
      setMessage(error.response ? error.response.data.message : 'User created successfully.');
    } finally {
      setLoading(false);
    }
  };

  return ( 
  <Box display="flex">
    <Navbar />
      <Box flexGrow={1}>
        <Header />
        <Container>
          
          <h2>System Users</h2>
          <Button variant="contained" onClick={handleOpen}>Add User</Button>
          
          <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Add New User</DialogTitle>
            <DialogContent>
              <TextField 
                label="First Name" 
                name="first_name" 
                fullWidth margin="dense" 
                value={newUser.first_name} 
                onChange={handleChange} 
              />
              <TextField 
                label="Last Name" 
                name="last_name" 
                fullWidth margin="dense" 
                value={newUser.last_name} 
                onChange={handleChange} 
              />
              <TextField 
                label="Email" 
                name="email" 
                fullWidth margin="dense" 
                value={newUser.email} 
                onChange={handleChange} 
              />
              <TextField 
                label="Role" 
                name="role_name" 
                fullWidth margin="dense" 
                value={newUser.role_name} 
                onChange={handleChange} 
              />
              {error && <p style={{ color: "red" }}>{error}</p>}
              {message && <p style={{ color: message.includes('Failed') ? 'red' : 'green' }}>{message}</p>}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : "Add"}
              </Button>
            </DialogActions>
          </Dialog>
          
          {fetchingUsers ? (
            <CircularProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.first_name} {user.last_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Container>
    </Box>
    </Box>
  );
};

export default Dashboard;