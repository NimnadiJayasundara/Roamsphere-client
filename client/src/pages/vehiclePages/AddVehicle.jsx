import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
  IconButton,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  Alert,
} from "@mui/material";
import { CloudUpload, Delete, Edit } from "@mui/icons-material";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebaseconfig";
import Navbar from "../../components/common/Navbar";
import Header from "../../components/common/Header";
import UserService from "../../services/UserService";

const AddVehicle = () => {
  const [vehicle, setVehicle] = useState({
    vehicleType: "",
    model: "",
    year: "",
    seatingCapacity: "",
    color: "",
    ownership: "",
    registrationProvince: "",
    licensePlate: "",
    chassisNo: "",
    registrationDate: "",
    expiryDate: "",
    insurance: "",
    category: "",
    image_url: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userExists, setUserExists] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [vehicleExists, setVehicleExists] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalVehicleData, setOriginalVehicleData] = useState(null);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        setInitialLoading(true);
        
        // Get email from localStorage (set during login)
        const email = localStorage.getItem("userEmail");
        
        if (!email) {
          setError("No user email found. Please log in first.");
          setInitialLoading(false);
          return;
        }

        console.log("Checking user with email:", email);

        // Check if user exists and get their information
        const userData = await UserService.findUserByEmail(email);
        console.log("User data received:", userData);
        
        if (userData && userData.exists !== false) {
          setUserExists(true);
          
          // Check if vehicle profile already exists for this driver
          try {
            console.log("Checking for existing vehicle profile...");
            const vehicleProfile = await UserService.getVehicleProfileByEmail(userData.email || email);
            console.log("Vehicle profile data:", vehicleProfile);
            
            if (vehicleProfile && vehicleProfile.vehicle_type) {
              // Vehicle profile exists - display it
              setVehicleExists(true);
              setIsEditing(false);
              
              const existingVehicle = {
                vehicleType: vehicleProfile.vehicle_type || "",
                model: vehicleProfile.model || "",
                year: vehicleProfile.year || "",
                seatingCapacity: vehicleProfile.seating_capacity || "",
                color: vehicleProfile.color || "",
                ownership: vehicleProfile.ownership || "",
                registrationProvince: vehicleProfile.registration_province || "",
                licensePlate: vehicleProfile.license_plate || "",
                chassisNo: vehicleProfile.chassis_no || "",
                registrationDate: vehicleProfile.registration_date ? vehicleProfile.registration_date.split('T')[0] : "",
                expiryDate: vehicleProfile.expiry_date ? vehicleProfile.expiry_date.split('T')[0] : "",
                insurance: vehicleProfile.insurance || "",
                category: vehicleProfile.category || "",
                image_url: vehicleProfile.image_url || "",
              };
              
              setVehicle(existingVehicle);
              setOriginalVehicleData(existingVehicle);
              setPreviewUrl(vehicleProfile.image_url || "");
            } else {
              // No vehicle profile - show add form
              setVehicleExists(false);
              setIsEditing(true);
            }
          } catch (vehicleErr) {
            console.log("No existing vehicle profile found, showing add form");
            setVehicleExists(false);
            setIsEditing(true);
          }
          
          setError(""); // Clear any previous errors
        } else {
          setError("User not found. Please register as a user first.");
          setUserExists(false);
        }
      } catch (err) {
        console.error("Error checking user:", err);
        setError("Error checking user. Please try again.");
        setUserExists(false);
      } finally {
        setInitialLoading(false);
      }
    };

    initializeUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVehicle({ ...vehicle, [name]: value });
    setError(""); // Clear error when user types
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    } else {
      setPreviewUrl(vehicle.image_url || "");
    }
  };

  const uploadImageToFirebase = async (file) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `VehicleProfile/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progress tracking can be added here
        },
        (error) => {
          console.error("Upload failed", error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };

  const validateForm = () => {
    const requiredFields = [
      'vehicleType', 'model', 'year', 'seatingCapacity', 'color', 
      'registrationProvince', 'licensePlate', 'chassisNo', 'registrationDate', 
      'expiryDate', 'insurance', 'category'
    ];

    for (let field of requiredFields) {
      if (!vehicle[field] || vehicle[field].toString().trim() === '') {
        setError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // Year validation
    const currentYear = new Date().getFullYear();
    if (vehicle.year < 1900 || vehicle.year > currentYear + 1) {
      setError('Please enter a valid year');
      return false;
    }

    // Seating capacity validation
    if (vehicle.seatingCapacity < 1 || vehicle.seatingCapacity > 50) {
      setError('Please enter a valid seating capacity (1-50)');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!userExists) {
      setError("User not found. Cannot add vehicle profile.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      let imageUrl = vehicle.image_url; // Keep existing image if no new one

      // Upload new image to Firebase if selected
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImageToFirebase(imageFile);
        setUploading(false);
      }

      // Get email from localStorage
      const email = localStorage.getItem("userEmail");

      // Prepare data for backend
      const vehicleData = {
        email: email,
        vehicle_type: vehicle.vehicleType,
        model: vehicle.model,
        year: parseInt(vehicle.year),
        seating_capacity: parseInt(vehicle.seatingCapacity),
        color: vehicle.color,
        ownership: vehicle.ownership,
        registration_province: vehicle.registrationProvince,
        license_plate: vehicle.licensePlate,
        chassis_no: vehicle.chassisNo,
        registration_date: vehicle.registrationDate,
        expiry_date: vehicle.expiryDate,
        insurance: vehicle.insurance,
        category: vehicle.category,
        image_url: imageUrl,
      };

      console.log("Submitting vehicle data:", vehicleData);

      // Send to your MySQL backend
      if (vehicleExists) {
        // Update existing vehicle
        await UserService.updateVehicle(vehicleData);
        setMessage("Vehicle profile updated successfully!");
      } else {
        // Add new vehicle
        await UserService.addVehicle(vehicleData);
        setMessage("Vehicle profile added successfully!");
        setVehicleExists(true);
      }
      
      // Update the vehicle state with new data including image URL
      const updatedVehicle = { ...vehicle, image_url: imageUrl };
      setVehicle(updatedVehicle);
      setOriginalVehicleData(updatedVehicle);
      setPreviewUrl(imageUrl);
      setImageFile(null);
      setIsEditing(false);
      
    } catch (err) {
      console.error("Error saving vehicle", err);
      if (err.response?.status === 404) {
        setError("User not found. Please register as a user first.");
      } else if (err.response?.status === 409 && !vehicleExists) {
        setError("Vehicle profile already exists for this user.");
      } else {
        setError(err.response?.data?.message || "Error saving vehicle. Please try again.");
      }
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError("");
    setMessage("");
  };

  const handleCancel = () => {
    if (vehicleExists && originalVehicleData) {
      // Restore original data
      setVehicle(originalVehicleData);
      setPreviewUrl(originalVehicleData.image_url || "");
      setIsEditing(false);
    } else {
      // Reset form for new vehicle
      setVehicle({
        vehicleType: "",
        model: "",
        year: "",
        seatingCapacity: "",
        color: "",
        ownership: "",
        registrationProvince: "",
        licensePlate: "",
        chassisNo: "",
        registrationDate: "",
        expiryDate: "",
        insurance: "",
        category: "",
        image_url: "",
      });
      setPreviewUrl("");
    }
    setImageFile(null);
    setError("");
    setMessage("");
  };

  // Show loading while checking user
  if (initialLoading) {
    return (
      <Box display="flex" height="100vh">
        <Navbar />
        <Box flexGrow={1} display="flex" flexDirection="column">
          <Header />
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography>Loading user information...</Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // Show error if user not found
  if (!userExists && error) {
    return (
      <Box display="flex" height="100vh">
        <Navbar />
        <Box flexGrow={1} display="flex" flexDirection="column">
          <Header />
          <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
              <Alert severity="error">
                {error}
              </Alert>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button 
                  variant="contained" 
                  onClick={() => window.location.href = '/login'}
                  sx={{ backgroundColor: '#FDCB42' }}
                >
                  Go to Login
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" height="100vh">
      <Navbar />
      <Box flexGrow={1} display="flex" flexDirection="column">
        <Header />
        <Box sx={{ p: 1, overflow: "auto", flexGrow: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {vehicleExists ? 'Vehicle Profile' : 'Add Vehicle Details'}
              </Typography>
              {vehicleExists && !isEditing && (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={handleEdit}
                  sx={{ 
                    borderColor: '#FDCB42',
                    color: '#FDCB42',
                    '&:hover': {
                      backgroundColor: '#FDCB42',
                      color: 'white'
                    }
                  }}
                >
                  Edit Vehicle
                </Button>
              )}
            </Box>

            {vehicleExists && !isEditing ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Vehicle profile exists. Click "Edit Vehicle" to make changes.
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                {vehicleExists ? 'Editing vehicle profile' : 'Adding vehicle details'} for your account.
              </Alert>
            )}

            {/* Success/Error Messages */}
            {message && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid
                item
                xs={12}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  gap: 5,
                }}
              >
                {/* Image Upload Section */}
                <Box
                  sx={{
                    border: "2px dashed #ccc",
                    width: 150,
                    height: 110,
                    mt: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Vehicle"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    isEditing && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          style={{ display: "none" }}
                          id="vehicle-image"
                        />
                        <label htmlFor="vehicle-image">
                          <IconButton component="span">
                            <CloudUpload />
                          </IconButton>
                        </label>
                      </>
                    )
                  )}
                  {isEditing && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {previewUrl && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setImageFile(null);
                            setPreviewUrl(vehicleExists ? vehicle.image_url : "");
                          }}
                        >
                          <Delete />
                        </IconButton>
                      )}
                      {previewUrl && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: "none" }}
                            id="vehicle-image-change"
                          />
                          <label htmlFor="vehicle-image-change">
                            <IconButton component="span" size="small">
                              <Edit />
                            </IconButton>
                          </label>
                        </>
                      )}
                    </Box>
                  )}
                </Box>

                {/* Category radio buttons */}
                <FormControl sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Vehicle Category*
                  </Typography>
                  <RadioGroup
                    row
                    name="category"
                    value={vehicle.category}
                    onChange={handleChange}
                  >
                    {["Luxury", "Safari", "Tour", "Adventure", "Casual"].map(
                      (cat) => (
                        <FormControlLabel
                          key={cat}
                          value={cat}
                          control={
                            <Radio
                              sx={{
                                color: "#FDCB42",
                                "&.Mui-checked": {
                                  color: "black",
                                },
                              }}
                              disabled={!isEditing}
                            />
                          }
                          label={cat}
                          disabled={!isEditing}
                        />
                      )
                    )}
                  </RadioGroup>
                </FormControl>

                {imageFile && (
                  <Typography variant="body2">{imageFile.name}</Typography>
                )}
              </Grid>

              {/* Left column */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Vehicle Details
                </Typography>
                {[
                  { name: "vehicleType", label: "Vehicle Type*" },
                  { name: "model", label: "Model*" },
                  { name: "year", label: "Year*", type: "number" },
                  { name: "seatingCapacity", label: "Seating Capacity*", type: "number" },
                  { name: "color", label: "Color*" },
                  { name: "ownership", label: "Ownership*" },
                ].map((field) => (
                  <TextField
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    type={field.type || "text"}
                    value={vehicle[field.name]}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    margin="normal"
                    required
                    disabled={!isEditing}
                    InputProps={{
                      readOnly: !isEditing,
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        backgroundColor: !isEditing ? '#f5f5f5' : 'inherit',
                      },
                    }}
                  />
                ))}
              </Grid>

              {/* Right column */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Registration Details
                </Typography>
                {[
                  { name: "registrationProvince", label: "Registration Province*" },
                  { name: "licensePlate", label: "License Plate No*" },
                  { name: "chassisNo", label: "Chassis No*" },
                  { name: "registrationDate", label: "Registration Date*", type: "date" },
                  { name: "expiryDate", label: "Registration Expiry Date*", type: "date" },
                  { name: "insurance", label: "Insurance Details*" },
                ].map((field) => (
                  <TextField
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    type={field.type || "text"}
                    value={vehicle[field.name]}
                    onChange={handleChange}
                    InputLabelProps={
                      field.type === "date" ? { shrink: true } : undefined
                    }
                    fullWidth
                    size="small"
                    margin="normal"
                    required
                    disabled={!isEditing}
                    InputProps={{
                      readOnly: !isEditing,
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        backgroundColor: !isEditing ? '#f5f5f5' : 'inherit',
                      },
                    }}
                  />
                ))}
              </Grid>

              {/* Action buttons - Only show when editing */}
              {isEditing && (
                <Grid
                  item
                  xs={12}
                  sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                >
                  <Button
                    variant="contained"
                    color="inherit"
                    onClick={handleCancel}
                    disabled={loading || uploading}
                    sx={{
                      mr: 2,
                      backgroundColor: "gray",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "black",
                      },
                      px: 8,
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={loading || uploading || !userExists}
                    variant="contained"
                    sx={{
                      backgroundColor: "#FDCB42",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "#fbbf24",
                      },
                      px: 8,
                    }}
                    onClick={handleSubmit}
                  >
                    {uploading ? "Uploading Image..." : loading ? "Saving..." : vehicleExists ? "Update Vehicle" : "Save Vehicle"}
                  </Button>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default AddVehicle;