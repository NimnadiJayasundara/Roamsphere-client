import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
  IconButton,
  Alert,
} from "@mui/material";
import { CloudUpload, Delete, Edit } from "@mui/icons-material";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebaseconfig";
import Navbar from "../../components/common/Navbar";
import Header from "../../components/common/Header";
import UserService from "../../services/UserService";

const AddDriver = () => {
  const [driver, setDriver] = useState({
    full_name: "",
    email: "",
    mobile: "",
    license_no: "",
    issuing_date: "",
    expiry_date: "",
    license_type: "",
    experience_years: "",
    image_url: "",
    address: "",
    age: "",
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userExists, setUserExists] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [driverExists, setDriverExists] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalDriverData, setOriginalDriverData] = useState(null);

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
          // User exists - pre-fill data
          setUserExists(true);
          const fullName = `${userData.first_name || ""} ${userData.last_name || ""}`.trim();
          
          setDriver((prev) => ({
            ...prev,
            full_name: fullName,
            email: userData.email || email,
          }));

          // Check if driver profile already exists
          try {
            console.log("Checking for existing driver profile...");
            const driverProfile = await UserService.getDriverProfileByEmail(userData.email || email);
            console.log("Driver profile data:", driverProfile);
            
            if (driverProfile && driverProfile.mobile) {
              // Driver profile exists - display it
              setDriverExists(true);
              setIsEditing(false);
              
              const existingDriver = {
                full_name: fullName,
                email: driverProfile.email || userData.email || email,
                mobile: driverProfile.mobile || "",
                license_no: driverProfile.license_no || "",
                issuing_date: driverProfile.issuing_date ? driverProfile.issuing_date.split('T')[0] : "",
                expiry_date: driverProfile.expiry_date ? driverProfile.expiry_date.split('T')[0] : "",
                license_type: driverProfile.license_type || "",
                experience_years: driverProfile.experience_years || "",
                image_url: driverProfile.image_url || "",
                address: driverProfile.address || "",
                age: driverProfile.age || "",
              };
              
              setDriver(existingDriver);
              setOriginalDriverData(existingDriver);
              setPreviewUrl(driverProfile.image_url || "");
            } else {
              // No driver profile - show add form
              setDriverExists(false);
              setIsEditing(true);
            }
          } catch (driverErr) {
            console.log("No existing driver profile found, showing add form");
            setDriverExists(false);
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
    
    // Prevent changing name and email (they're read-only)
    if (name === 'full_name' || name === 'email') {
      return;
    }
    
    setDriver({ ...driver, [name]: value });
    setError(""); // Clear error when user types
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    } else {
      setPreviewUrl(driver.image_url || "");
    }
  };

  const uploadImageToFirebase = async (file) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `DriverProfile/${Date.now()}_${file.name}`);
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
      'email', 'mobile', 'license_no', 'issuing_date', 'expiry_date', 
      'license_type', 'experience_years', 'address', 'age'
    ];

    for (let field of requiredFields) {
      if (!driver[field] || driver[field].toString().trim() === '') {
        setError(`Please fill in ${field.replace('_', ' ')}`);
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(driver.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Mobile validation
    if (driver.mobile.length < 10) {
      setError('Please enter a valid mobile number');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!userExists) {
      setError("User not found. Cannot add driver profile.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      let imageUrl = driver.image_url; // Keep existing image if no new one

      // Upload new image to Firebase if selected
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImageToFirebase(imageFile);
        setUploading(false);
      }

      // Prepare data for backend
      const driverData = {
        email: driver.email,
        mobile: driver.mobile,
        license_no: driver.license_no,
        issuing_date: driver.issuing_date,
        expiry_date: driver.expiry_date,
        license_type: driver.license_type,
        experience_years: parseInt(driver.experience_years),
        image_url: imageUrl,
        address: driver.address,
        age: parseInt(driver.age),
      };

      console.log("Submitting driver data:", driverData);

      // Send to your MySQL backend
      if (driverExists) {
        // Update existing driver
        await UserService.updateDriver(driverData);
        setMessage("Driver profile updated successfully!");
      } else {
        // Add new driver
        await UserService.addDriver(driverData);
        setMessage("Driver profile added successfully!");
        setDriverExists(true);
      }
      
      // Update the driver state with new data including image URL
      const updatedDriver = { ...driver, image_url: imageUrl };
      setDriver(updatedDriver);
      setOriginalDriverData(updatedDriver);
      setPreviewUrl(imageUrl);
      setImageFile(null);
      setIsEditing(false);
      
    } catch (err) {
      console.error("Error saving driver", err);
      if (err.response?.status === 404) {
        setError("User not found. Please register as a user first.");
      } else if (err.response?.status === 409 && !driverExists) {
        setError("Driver profile already exists for this user.");
      } else {
        setError(err.response?.data?.message || "Error saving driver. Please try again.");
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
    if (driverExists && originalDriverData) {
      // Restore original data
      setDriver(originalDriverData);
      setPreviewUrl(originalDriverData.image_url || "");
      setIsEditing(false);
    } else {
      // Reset form for new driver
      setDriver((prev) => ({
        ...prev,
        mobile: "",
        license_no: "",
        issuing_date: "",
        expiry_date: "",
        license_type: "",
        experience_years: "",
        image_url: "",
        address: "",
        age: "",
      }));
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
                {driverExists ? 'Driver Profile' : 'Add Driver Details'}
              </Typography>
              {driverExists && !isEditing && (
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
                  Edit Profile
                </Button>
              )}
            </Box>

            {driverExists && !isEditing ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Driver profile exists for {driver.email}. Click "Edit Profile" to make changes.
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                {driverExists ? 'Editing driver profile for' : 'Adding driver details to'} your existing account ({driver.email}). Your name and email cannot be changed.
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
              {/* Image Display/Upload Section */}
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
                      alt="Driver profile"
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
                          id="driver-image"
                        />
                        <label htmlFor="driver-image">
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
                            setPreviewUrl(driverExists ? driver.image_url : "");
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
                            id="driver-image-change"
                          />
                          <label htmlFor="driver-image-change">
                            <IconButton component="span" size="small">
                              <Edit />
                            </IconButton>
                          </label>
                        </>
                      )}
                    </Box>
                  )}
                </Box>

                {imageFile && (
                  <Typography variant="body2">{imageFile.name}</Typography>
                )}
              </Grid>

              {/* Personal Details */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Personal Details
                </Typography>
                {[
                  { name: "full_name", label: "Full Name" },
                  { name: "email", label: "Email", type: "email" },
                  { name: "mobile", label: "Mobile Number*" },
                  { name: "address", label: "Address*" },
                  { name: "age", label: "Age*", type: "number" },
                ].map((field) => (
                  <TextField
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    type={field.type || "text"}
                    value={driver[field.name]}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    margin="normal"
                    required={field.label.includes('*')}
                    disabled={!isEditing || field.name === 'full_name' || field.name === 'email'}
                    InputProps={{
                      readOnly: !isEditing || field.name === 'full_name' || field.name === 'email',
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        backgroundColor: (!isEditing || field.name === 'full_name' || field.name === 'email') ? '#f5f5f5' : 'inherit',
                      },
                    }}
                  />
                ))}
              </Grid>

              {/* Professional Details */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Professional Details
                </Typography>
                {[
                  { name: "license_no", label: "License Number*" },
                  { name: "issuing_date", label: "License Issuing Date*", type: "date" },
                  { name: "expiry_date", label: "License Expiry Date*", type: "date" },
                  { name: "license_type", label: "License Type*" },
                  { name: "experience_years", label: "Years of Experience*", type: "number" },
                ].map((field) => (
                  <TextField
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    type={field.type || "text"}
                    value={driver[field.name]}
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

              {/* Buttons - Only show when editing */}
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
                    {uploading ? "Uploading Image..." : loading ? "Saving..." : driverExists ? "Update Driver Profile" : "Save Driver Profile"}
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

export default AddDriver;