import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Container
} from '@mui/material';
import {
  LocationOn,
  DateRange,
  People,
  DirectionsCar,
  AttachMoney,
  Notes,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TripServices from '../../services/TripServices';
import LocationService from '../../services/LocationService';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';

const steps = ['Trip Details', 'Location & Timing', 'Passenger Info', 'Requirements', 'Review'];

const tripCategories = [
  'City Tour',
  'Airport Transfer',
  'Long Distance',
  'Sightseeing',
  'Business Trip',
  'Wedding',
  'Event Transportation',
  'Custom'
];

const vehicleTypes = [
  'Car (1-4 passengers)',
  'Van (5-8 passengers)',
  'Minibus (9-15 passengers)',
  'Bus (16+ passengers)'
];

function CreateTrip() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    // Step 1: Trip Details
    title: '',
    category: '',
    specialRequirements: '',
    budget: '',
    notes: '',

    // Step 2: Location & Timing
    origin: '',
    destination: '',
    originLatitude: null,
    originLongitude: null,
    destinationLatitude: null,
    destinationLongitude: null,
    preferredDate: '',
    preferredTime: '',
    returnDate: '',
    returnTime: '',
    isReturnTrip: false,

    // Step 3: Passenger Info
    passengerCount: 1,
    passengerNames: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',

    // Step 4: Requirements
    vehicleType: '',
    stops: []
  });

  const [currentLocation, setCurrentLocation] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const validateCurrentStep = () => {
    switch (activeStep) {
      case 0:
        if (!formData.title || !formData.category) {
          setError('Please fill in all required fields');
          return false;
        }
        break;
      case 1:
        if (!formData.origin || !formData.destination || !formData.preferredDate || !formData.preferredTime) {
          setError('Please fill in all required fields');
          return false;
        }
        break;
      case 2:
        if (!formData.contactName || !formData.contactPhone || !formData.contactEmail) {
          setError('Please fill in all required contact information');
          return false;
        }
        break;
      case 3:
        if (!formData.vehicleType) {
          setError('Please select a vehicle type');
          return false;
        }
        break;
      default:
        return true;
    }
    setError('');
    return true;
  };

  const getCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);
      setFormData(prev => ({
        ...prev,
        origin: 'Current Location',
        originLatitude: location.lat,
        originLongitude: location.lng
      }));
    } catch (err) {
      setError('Unable to get current location');
    }
  };

  const geocodeLocation = async (address, type) => {
    try {
      const result = await LocationService.geocode(address);
      setFormData(prev => ({
        ...prev,
        [`${type}Latitude`]: result.lat,
        [`${type}Longitude`]: result.lng
      }));
      return true;
    } catch (err) {
      setError(`Unable to find location: ${address}`);
      return false;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Geocode locations if not already done
      if (!formData.originLatitude && formData.origin !== 'Current Location') {
        const originGeocoded = await geocodeLocation(formData.origin, 'origin');
        if (!originGeocoded) return;
      }

      if (!formData.destinationLatitude) {
        const destGeocoded = await geocodeLocation(formData.destination, 'destination');
        if (!destGeocoded) return;
      }

      const tripData = {
        ...formData,
        stops: formData.stops.join(',')
      };

      const response = await TripServices.createTripRequestEnhanced(tripData);

      if (response.success) {
        setSuccess('Trip request created successfully! You will be notified when a driver is assigned.');
        setTimeout(() => {
          navigate('/customer/my-trips');
        }, 2000);
      } else {
        setError(response.message || 'Failed to create trip request');
      }
    } catch (err) {
      console.error('Error creating trip:', err);
      setError('Failed to create trip request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Trip Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Colombo City Tour, Airport Transfer"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Trip Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  {tripCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Budget (LKR)"
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                placeholder="Optional"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Requirements"
                multiline
                rows={3}
                value={formData.specialRequirements}
                onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                placeholder="Any special requirements or requests..."
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Pickup Location
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Origin"
                  value={formData.origin}
                  onChange={(e) => handleInputChange('origin', e.target.value)}
                  placeholder="Enter pickup location"
                  required
                />
                <Button
                  variant="outlined"
                  startIcon={<LocationOn />}
                  onClick={getCurrentLocation}
                  sx={{ minWidth: 120 }}
                >
                  Use Current
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Destination
              </Typography>
              <TextField
                fullWidth
                label="Destination"
                value={formData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                placeholder="Enter destination"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Preferred Date"
                value={formData.preferredDate}
                onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Preferred Time"
                value={formData.preferredTime}
                onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <input
                    type="checkbox"
                    checked={formData.isReturnTrip}
                    onChange={(e) => handleInputChange('isReturnTrip', e.target.checked)}
                  />
                }
                label="This is a return trip"
              />
            </Grid>
            {formData.isReturnTrip && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Return Date"
                    value={formData.returnDate}
                    onChange={(e) => handleInputChange('returnDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Return Time"
                    value={formData.returnTime}
                    onChange={(e) => handleInputChange('returnTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Number of Passengers"
                value={formData.passengerCount}
                onChange={(e) => handleInputChange('passengerCount', e.target.value)}
                inputProps={{ min: 1, max: 50 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Passenger Names"
                value={formData.passengerNames}
                onChange={(e) => handleInputChange('passengerNames', e.target.value)}
                placeholder="Names separated by commas"
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="subtitle2">Contact Information</Typography>
              </Divider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Name"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                required
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Vehicle Type</InputLabel>
                <Select
                  value={formData.vehicleType}
                  onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                >
                  {vehicleTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                multiline
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information or special requests..."
              />
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Review Your Trip Request
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Trip Details
                  </Typography>
                  <Typography><strong>Title:</strong> {formData.title}</Typography>
                  <Typography><strong>Category:</strong> {formData.category}</Typography>
                  <Typography><strong>Vehicle Type:</strong> {formData.vehicleType}</Typography>
                  {formData.budget && (
                    <Typography><strong>Budget:</strong> LKR {formData.budget}</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Location & Timing
                  </Typography>
                  <Typography><strong>From:</strong> {formData.origin}</Typography>
                  <Typography><strong>To:</strong> {formData.destination}</Typography>
                  <Typography><strong>Date:</strong> {formData.preferredDate}</Typography>
                  <Typography><strong>Time:</strong> {formData.preferredTime}</Typography>
                  {formData.isReturnTrip && (
                    <Typography><strong>Return:</strong> {formData.returnDate} at {formData.returnTime}</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Passengers
                  </Typography>
                  <Typography><strong>Count:</strong> {formData.passengerCount}</Typography>
                  {formData.passengerNames && (
                    <Typography><strong>Names:</strong> {formData.passengerNames}</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Contact
                  </Typography>
                  <Typography><strong>Name:</strong> {formData.contactName}</Typography>
                  <Typography><strong>Phone:</strong> {formData.contactPhone}</Typography>
                  <Typography><strong>Email:</strong> {formData.contactEmail}</Typography>
                </CardContent>
              </Card>
            </Grid>
            {(formData.specialRequirements || formData.notes) && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Additional Information
                    </Typography>
                    {formData.specialRequirements && (
                      <Typography><strong>Requirements:</strong> {formData.specialRequirements}</Typography>
                    )}
                    {formData.notes && (
                      <Typography><strong>Notes:</strong> {formData.notes}</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box display="flex" sx={{ minHeight: '100vh' }}>
      {!isMobile && <Navbar />}
      <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column' }}>
        {!isMobile && <Header />}
        
        <Container maxWidth="lg" sx={{ flexGrow: 1, py: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3, color: '#FDCB42', textAlign: 'center' }}>
              Create Trip Request
            </Typography>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                {success}
              </Alert>
            )}

            <Box sx={{ mb: 4 }}>
              {renderStepContent(activeStep)}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                    sx={{
                      bgcolor: '#FDCB42',
                      color: 'black',
                      '&:hover': { bgcolor: '#fbbf24' }
                    }}
                  >
                    {loading ? 'Creating...' : 'Create Trip Request'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{
                      bgcolor: '#FDCB42',
                      color: 'black',
                      '&:hover': { bgcolor: '#fbbf24' }
                    }}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}

export default CreateTrip;
