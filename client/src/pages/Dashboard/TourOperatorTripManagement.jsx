import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Badge,
  useTheme,
  useMediaQuery,
  Container,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Assignment,
  DirectionsCar,
  Person,
  Phone,
  Email,
  AccessTime,
  LocationOn,
  CheckCircle,
  Cancel,
  Refresh,
  FilterList,
  Search,
  Add,
  Visibility,
  Edit
} from '@mui/icons-material';
import TripServices from '../../services/TripServices';
import DriverServices from '../../services/DriverServices';
import VehicleServices from '../../services/VehicleServices';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';

function TourOperatorTripManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusTabs = [
    { label: 'All', value: 'all', count: 0 },
    { label: 'Pending', value: 'pending', count: 0 },
    { label: 'Confirmed', value: 'confirmed', count: 0 },
    { label: 'In Progress', value: 'in-progress', count: 0 },
    { label: 'Completed', value: 'completed', count: 0 },
    { label: 'Cancelled', value: 'cancelled', count: 0 }
  ];

  useEffect(() => {
    fetchTrips();
    fetchDrivers();
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterTrips();
  }, [trips, searchTerm, statusFilter]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await TripServices.getAllTripRequestsEnhanced();
      
      if (response.success) {
        setTrips(response.data.trips);
        updateStatusCounts(response.data.trips);
      } else {
        setError(response.message || 'Failed to fetch trips');
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await DriverServices.getAvailableDrivers();
      if (response.success) {
        setDrivers(response.data);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await VehicleServices.getAvailableVehicles();
      if (response.success) {
        setVehicles(response.data);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  const updateStatusCounts = (tripList) => {
    statusTabs.forEach(tab => {
      if (tab.value === 'all') {
        tab.count = tripList.length;
      } else {
        tab.count = tripList.filter(trip => trip.status === tab.value).length;
      }
    });
  };

  const filterTrips = () => {
    let filtered = trips;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(trip =>
        trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.customer_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.customer_last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTrips(filtered);
  };

  const handleAssignTrip = (trip) => {
    setSelectedTrip(trip);
    setSelectedDriver('');
    setSelectedVehicle('');
    setEstimatedCost('');
    setAssignmentNotes('');
    setAssignmentDialogOpen(true);
  };

  const handleAssignmentSubmit = async () => {
    try {
      if (!selectedDriver || !selectedVehicle || !estimatedCost) {
        setError('Please fill in all required fields');
        return;
      }

      const response = await TripServices.assignTripToDriverEnhanced(selectedTrip.trip_id, {
        driverId: selectedDriver,
        vehicleId: selectedVehicle,
        estimatedCost: parseFloat(estimatedCost),
        notes: assignmentNotes
      });

      if (response.success) {
        setAssignmentDialogOpen(false);
        fetchTrips();
        setError('');
      } else {
        setError(response.message || 'Failed to assign trip');
      }
    } catch (err) {
      console.error('Error assigning trip:', err);
      setError('Failed to assign trip');
    }
  };

  const handleStatusUpdate = async (tripId, newStatus) => {
    try {
      const response = await TripServices.updateTripStatus(tripId, newStatus);
      
      if (response.success) {
        fetchTrips();
        setError('');
      } else {
        setError(response.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'in-progress': return 'success';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Assignment';
      case 'confirmed': return 'Driver Assigned';
      case 'in-progress': return 'Trip in Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={60} sx={{ color: '#FDCB42' }} />
      </Box>
    );
  }

  return (
    <Box display="flex" sx={{ minHeight: '100vh' }}>
      {!isMobile && <Navbar />}
      <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column' }}>
        {!isMobile && <Header />}
        
        <Container maxWidth="xl" sx={{ flexGrow: 1, py: 2 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ color: '#FDCB42' }}>
                Trip Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={fetchTrips}
                sx={{
                  bgcolor: '#FDCB42',
                  color: 'black',
                  '&:hover': { bgcolor: '#fbbf24' }
                }}
              >
                Refresh
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Search and Filter */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search trips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ minWidth: 200 }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Status Tabs */}
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => {
                setTabValue(newValue);
                setStatusFilter(statusTabs[newValue].value);
              }}
              sx={{ mb: 3 }}
            >
              {statusTabs.map((tab, index) => (
                <Tab
                  key={tab.value}
                  label={
                    <Badge badgeContent={tab.count} color="primary">
                      {tab.label}
                    </Badge>
                  }
                />
              ))}
            </Tabs>

            {/* Trips Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Trip ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTrips.map((trip) => (
                    <TableRow key={trip.trip_id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {trip.trip_id.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {trip.customer_first_name} {trip.customer_last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {trip.customer_email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {trip.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {trip.category}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {trip.origin} → {trip.destination}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {trip.preferred_date}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {trip.preferred_time}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(trip.status)}
                          color={getStatusColor(trip.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {trip.driver_first_name ? (
                          <Box>
                            <Typography variant="body2">
                              {trip.driver_first_name} {trip.driver_last_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {trip.driver_mobile}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not assigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {trip.vehicle_model ? (
                          <Box>
                            <Typography variant="body2">
                              {trip.vehicle_model}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {trip.vehicle_plate}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not assigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {trip.status === 'pending' && (
                            <Tooltip title="Assign Trip">
                              <IconButton
                                size="small"
                                onClick={() => handleAssignTrip(trip)}
                                sx={{ color: '#FDCB42' }}
                              >
                                <Assignment />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {/* Navigate to trip details */}}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredTrips.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No trips found
                </Typography>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>

      {/* Assignment Dialog */}
      <Dialog
        open={assignmentDialogOpen}
        onClose={() => setAssignmentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Assign Trip: {selectedTrip?.title}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Driver</InputLabel>
                <Select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                >
                  {drivers.map((driver) => (
                    <MenuItem key={driver.driver_id} value={driver.driver_id}>
                      {driver.first_name} {driver.last_name} - {driver.mobile}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Vehicle</InputLabel>
                <Select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                >
                  {vehicles.map((vehicle) => (
                    <MenuItem key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                      {vehicle.model} - {vehicle.license_plate} ({vehicle.seating_capacity} seats)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Cost (LKR)"
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Duration (minutes)"
                type="number"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Assignment Notes"
                multiline
                rows={3}
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Any special instructions for the driver..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignmentSubmit}
            sx={{
              bgcolor: '#FDCB42',
              color: 'black',
              '&:hover': { bgcolor: '#fbbf24' }
            }}
          >
            Assign Trip
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TourOperatorTripManagement;
