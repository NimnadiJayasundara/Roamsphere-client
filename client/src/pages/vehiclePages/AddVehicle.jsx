import React, { useState } from "react";
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
  FormLabel,
} from "@mui/material";
import { CloudUpload, Delete, Edit } from "@mui/icons-material";
import Navbar from "../../components/common/Navbar";
import Header from "../../components/common/Header";

const AddVehicle = () => {
  const [vehicle, setVehicle] = useState({
    vehicleType: "Safari Jeep",
    model: "Sienna",
    year: "2015",
    seatingCapacity: "5",
    color: "Black",
    ownership: "Not available",
    registrationProvince: "Western",
    licensePlate: "NC-46553",
    chassisNo: "234",
    registrationDate: "2016-12-12",
    expiryDate: "2036-12-12",
    insurance: "Ce insurance",
    category: "", 
  });

  const handleChange = (e) => {
    setVehicle({ ...vehicle, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log(vehicle);
  };

  return (
    <Box display="flex" height="100vh">
      <Navbar />
      <Box flexGrow={1} display="flex" flexDirection="column">
        <Header />
        <Box sx={{ p: 1, overflow: "auto", flexGrow: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Registration & Legal Details
            </Typography>
            <Grid container spacing={2}>
              <Grid
                item
                xs={12}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  gap: 50,
                }}
              >
                {/* Image box */}
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
                  }}
                >
                  <IconButton>
                    <CloudUpload />
                  </IconButton>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton size="small">
                      <Delete />
                    </IconButton>
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                  </Box>
                </Box>

                {/* Category radio buttons */}
                <FormControl sx={{ mt: 1 }}>
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
                            />
                          }
                          label={cat}
                        />
                      )
                    )}
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* Left column */}
              <Grid item xs={12} md={6}>
                {[
                  { name: "vehicleType", label: "Vehicle Type" },
                  { name: "model", label: "Model" },
                  { name: "year", label: "Year" },
                  { name: "seatingCapacity", label: "Seating Capacity" },
                  { name: "color", label: "Color" },
                  { name: "ownership", label: "Ownership" },
                ].map((field) => (
                  <TextField
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    value={vehicle[field.name]}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    margin="normal"
                  />
                ))}
              </Grid>

              {/* Right column */}
              <Grid item xs={12} md={6}>
                {[
                  {
                    name: "registrationProvince",
                    label: "Registration Province",
                  },
                  { name: "licensePlate", label: "License Plate No" },
                  { name: "chassisNo", label: "Chassis No" },
                  {
                    name: "registrationDate",
                    label: "Registration Date",
                    type: "date",
                  },
                  {
                    name: "expiryDate",
                    label: "Registration Expiry Date",
                    type: "date",
                  },
                  { name: "insurance", label: "Insurance Details" },
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
                  />
                ))}
              </Grid>

              {/* Action buttons */}
              <Grid
                item
                xs={12}
                sx={{ display: "flex", justifyContent: "center", mt: 1 }}
              >
                <Button
                  variant="contained"
                  color="inherit"
                  sx={{
                    mr: 2,
                    backgroundColor: "Gray",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "black",
                    },
                    px: 8,
                  }}
                >
                  Remove
                </Button>
                <Button
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
                  Save Item
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default AddVehicle;