// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Paper,
//   Typography,
//   Grid,
//   Button,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Chip,
//   Alert,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   IconButton,
//   Card,
//   CardContent,
//   useTheme,
//   useMediaQuery,
//   CircularProgress,
//   Avatar,
//   Rating,
//   Divider,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableRow
// } from '@mui/material';
// import {
//   LocationOn,
//   DirectionsCar,
//   Person,
//   AttachMoney,
//   Close as CloseIcon,
//   Assignment,
//   CheckCircle,
//   CalendarToday,
//   PersonAdd,
//   Star,
//   Terrain,
//   Map,
//   Explore,
//   DriveEta,
//   Route,
//   Calculate
// } from '@mui/icons-material';
// import UserService from '../../services/UserService';

// const TripScheduler = ({
//   open,
//   onClose,
//   onSave,
//   requestData = null,
//   isMobile = false
// }) => {
//   const theme = useTheme();
//   const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

//   const [assignmentData, setAssignmentData] = useState({
//     driverId: '',
//     vehicleId: '',
//     estimatedCost: ''
//   });

//   const [availableDrivers, setAvailableDrivers] = useState([]);
//   const [availableVehicles, setAvailableVehicles] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [resourcesLoading, setResourcesLoading] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [distance, setDistance] = useState(0);

//   useEffect(() => {
//     if (open && requestData) {
//       setDistance(requestData.estimated_distance_km || estimateDistance());
//       fetchAvailableResources();
//       setAssignmentData({
//         driverId: '',
//         vehicleId: '',
//         estimatedCost: ''
//       });
//     }
//   }, [open, requestData]);

//   useEffect(() => {
//     if (assignmentData.driverId && assignmentData.vehicleId && distance) {
//       const calculatedCost = calculateBasicCost();
//       setAssignmentData(prev => ({
//         ...prev,
//         estimatedCost: calculatedCost.totalCost.toString()
//       }));
//     }
//   }, [assignmentData.driverId, assignmentData.vehicleId, distance, requestData]);

//   const estimateDistance = () => Math.floor(Math.random() * 150) + 30;

//   const fetchAvailableResources = async () => {
//     try {
//       setResourcesLoading(true);

//       const [usersResponse, vehiclesResponse] = await Promise.all([
//         UserService.getAllUsers().catch(() => []),
//         UserService.getAvailableVehicles().catch(() => [])
//       ]);

    
//       let driversData = [];
//       if (usersResponse && Array.isArray(usersResponse)) {
//         const driverUsers = usersResponse.filter(
//           user => user.role_name === 'driver' && user.status !== 'inactive'
//         );

//         const driversWithProfiles = await Promise.all(
//           driverUsers.map(async (user) => {
//             try {
//               const driverProfile = await UserService.getDriverProfileByEmail(user.email);
//               return {
//                 user_id: user.id,
//                 driver_id: user.id,
//                 name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Driver',
//                 email: user.email,
//                 profile_image: driverProfile?.image_url || user.image_url || '',
//                 phone: driverProfile?.mobile || 'N/A',
//                 license_type: driverProfile?.license_type || 'Standard License',
//                 experience_years: driverProfile?.experience_years || 0,
//                 rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
//                 availability: driverProfile?.availability || 'Available'
//               };
//             } catch {
//               return {
//                 user_id: user.id,
//                 driver_id: user.id,
//                 name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Driver',
//                 email: user.email,
//                 profile_image: user.image_url || '',
//                 phone: 'Profile not created',
//                 license_type: 'N/A',
//                 experience_years: 0,
//                 rating: 0,
//                 availability: 'Available'
//               };
//             }
//           })
//         );

//         driversData = driversWithProfiles.filter(
//           driver => driver.availability?.toLowerCase() === 'available'
//         );
//       }

//       // Vehicle fetching
//       let vehiclesData = [];
//       if (vehiclesResponse && Array.isArray(vehiclesResponse)) {
//         vehiclesData = vehiclesResponse
//           .filter(vehicle =>
//             vehicle.availability?.toLowerCase() === 'available' &&
//             vehicle.seating_capacity >= (requestData?.passenger_count || 1)
//           )
//           .map(vehicle => ({
//             vehicle_id: vehicle.vehicle_id || vehicle.id,
//             vehicle_type: vehicle.vehicle_type,
//             model: vehicle.model,
//             seating_capacity: vehicle.seating_capacity,
//             license_plate: vehicle.license_plate,
//             category: vehicle.category,
//             availability: vehicle.availability,
//             color: vehicle.color,
//             year: vehicle.year,
//             fuel_type: vehicle.fuel_type,
//             transmission: vehicle.transmission
//           }));

//         // if (requestData?.category) {
//         //   const filteredByCategory = vehiclesData.filter(vehicle =>
//         //     vehicle.category === requestData.category
//         //   );
//         //   if (filteredByCategory.length > 0) {
//         //     vehiclesData = filteredByCategory;
//         //   }
//         // }
//       }

//       setAvailableDrivers(driversData);
//       setAvailableVehicles(vehiclesData);

//       if (driversData.length === 0) {
//         setErrors(prev => ({
//           ...prev,
//           drivers: `No drivers available at the moment.`
//         }));
//       }

//       if (vehiclesData.length === 0) {
//         setErrors(prev => ({
//           ...prev,
//           vehicles: `No vehicles available${requestData?.category ? ` in ${requestData.category} category` : ''}.`
//         }));
//       }
//     } catch (error) {
//       setErrors(prev => ({
//         ...prev,
//         fetch: 'Failed to load available drivers and vehicles. Please try again.'
//       }));
//       setAvailableDrivers([]);
//       setAvailableVehicles([]);
//     } finally {
//       setResourcesLoading(false);
//     }
//   };

//   const calculateBasicCost = () => {
//     const pricingConfig = {
//       fixedRate: 500,
//       perKmRate: 80,
//       categoryRates: {
//         'Luxury': 3500,
//         'Safari': 2800,
//         'Tour': 2000,
//         'Adventure': 2200,
//         'Casual': 1500,
//         'Cultural': 1800,
//         'Business': 2500,
//         'Airport': 1200
//       }
//     };
//     const tripCategory = requestData?.category || 'Casual';
//     const fixedRate = pricingConfig.fixedRate;
//     const distanceCost = distance * pricingConfig.perKmRate;
//     const categoryAmount = pricingConfig.categoryRates[tripCategory] || pricingConfig.categoryRates['Casual'];
//     const totalCost = fixedRate + distanceCost + categoryAmount;
//     return {
//       fixedRate,
//       distanceCost,
//       categoryAmount,
//       categoryName: tripCategory,
//       totalCost: Math.ceil(totalCost)
//     };
//   };

//   const handleDriverAssign = (driverId) => {
//     setAssignmentData(prev => ({
//       ...prev,
//       driverId: driverId
//     }));
//     if (errors.driverId) {
//       setErrors(prev => ({
//         ...prev,
//         driverId: undefined
//       }));
//     }
//   };

//   const handleInputChange = (field, value) => {
//     setAssignmentData(prev => ({
//       ...prev,
//       [field]: value
//     }));
//     if (errors[field]) {
//       setErrors(prev => ({
//         ...prev,
//         [field]: undefined
//       }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     if (!assignmentData.driverId) newErrors.driverId = 'Driver selection is required';
//     if (!assignmentData.vehicleId) newErrors.vehicleId = 'Vehicle selection is required';
//     if (!assignmentData.estimatedCost) newErrors.estimatedCost = 'Estimated cost is required';
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleAssign = async () => {
//     if (!validateForm()) return;
//     try {
//       setLoading(true);
//       const tripToSave = {
//         ...requestData,
//         assigned_driver_id: assignmentData.driverId,
//         assigned_vehicle_id: assignmentData.vehicleId,
//         estimated_cost: assignmentData.estimatedCost,
//         estimated_distance_km: distance,
//         status: 'confirmed'
//       };
//       await onSave(tripToSave);
//       onClose();
//     } catch (error) {
//       setErrors({ submit: 'Failed to assign trip. Please try again.' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

//   const formatCurrency = (amount) => new Intl.NumberFormat('en-LK', {
//     style: 'currency',
//     currency: 'LKR',
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0
//   }).format(amount);

//   const formatDateTime = (date, time) => {
//     if (!date || !time) return 'Not specified';
//     try {
//       const dateObj = new Date(date);
//       const formattedDate = dateObj.toLocaleDateString('en-GB', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric'
//       });
//       return `${formattedDate} at ${time}`;
//     } catch {
//       return `${date} at ${time}`;
//     }
//   };

//   const formatLocation = (location) => {
//     if (!location) return 'Not specified';
//     return location.length > 30 ? `${location.substring(0, 30)}...` : location;
//   };

//   // Get selected driver and vehicle for summary
//   const selectedDriver = availableDrivers.find(d => d.user_id === assignmentData.driverId);
//   const selectedVehicle = availableVehicles.find(v => v.vehicle_id === assignmentData.vehicleId);

//   if (!requestData) return null;

//   return (
//     <Dialog
//       open={open}
//       onClose={onClose}
//       maxWidth="lg"
//       fullWidth
//       fullScreen={isSmallScreen}
//       PaperProps={{
//         sx: {
//           minHeight: isSmallScreen ? '100vh' : '80vh',
//           m: isSmallScreen ? 0 : 2
//         }
//       }}
//     >
//       <DialogTitle sx={{
//         bgcolor: '#FDCB42',
//         color: 'black',
//         fontWeight: 'bold',
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center'
//       }}>
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <Assignment sx={{ mr: 1 }} />
//           Assign Trip to Driver & Vehicle
//         </Box>
//         {isSmallScreen && (
//           <IconButton onClick={onClose} sx={{ color: 'black' }}>
//             <CloseIcon />
//           </IconButton>
//         )}
//       </DialogTitle>

//       <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
//         {errors.submit && (
//           <Alert severity="error" sx={{ mb: 2 }}>
//             {errors.submit}
//           </Alert>
//         )}
//         {errors.fetch && (
//           <Alert severity="error" sx={{ mb: 2 }}>
//             {errors.fetch}
//           </Alert>
//         )}

//         <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
//           <CardContent sx={{ py: 2 }}>
//             <Typography variant="h6" gutterBottom sx={{ color: '#FDCB42', fontWeight: 'bold', mb: 2 }}>
//               Trip Overview - {requestData?.category || 'Standard'} Trip
//             </Typography>
//             <Grid container spacing={1}>
//               <Grid item xs={12} md={6}>
//                 <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                   <CalendarToday sx={{ mr: 1, color: 'primary.main', fontSize: 16 }} />
//                   <strong>{formatDateTime(requestData.preferred_date, requestData.preferred_time)}</strong>
//                 </Typography>
//                 <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                   <Person sx={{ mr: 1, color: 'info.main', fontSize: 16 }} />
//                   <strong>{requestData.passenger_count || 1} passengers</strong> • {requestData.contact_name}
//                 </Typography>
//               </Grid>
//               <Grid item xs={12} md={6}>
//                 <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                   <LocationOn sx={{ mr: 1, color: 'success.main', fontSize: 16 }} />
//                   <strong>From:</strong> {formatLocation(requestData.origin)}
//                 </Typography>
//                 <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                   <LocationOn sx={{ mr: 1, color: 'error.main', fontSize: 16 }} />
//                   <strong>To:</strong> {formatLocation(requestData.destination)}
//                 </Typography>
//               </Grid>
//             </Grid>
//           </CardContent>
//         </Card>

//         <Grid container spacing={3}>
//           <Grid item xs={12} md={7}>
//             {resourcesLoading ? (
//               <Box display="flex" alignItems="center" gap={2} justifyContent="center" py={4}>
//                 <CircularProgress size={20} />
//                 <Typography variant="body2">Loading available resources...</Typography>
//               </Box>
//             ) : (
//               <Grid container spacing={2}>
//                 <Grid item xs={12}>
//                   <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
//                     <Person sx={{ mr: 1, color: '#FDCB42' }} />
//                     Available Drivers ({availableDrivers.length})
//                   </Typography>
//                   {errors.drivers && (
//                     <Alert severity="warning" sx={{ mb: 2 }}>
//                       {errors.drivers}
//                     </Alert>
//                   )}
//                   {availableDrivers.length === 0 ? (
//                     <Alert severity="warning" sx={{ mb: 2 }}>
//                       No drivers available at the moment.
//                       <br />
//                       <Typography variant="body2" sx={{ mt: 1 }}>
//                         • Ensure drivers are marked as available
//                         • Consider expanding search criteria
//                       </Typography>
//                     </Alert>
//                   ) : (
//                     <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
//                       <Box>
//                         {availableDrivers.map((driver, index) => (
//                           <Box
//                             key={driver.user_id || driver.driver_id}
//                             sx={{
//                               display: 'flex',
//                               alignItems: 'center',
//                               bgcolor: assignmentData.driverId === driver.user_id ? 'rgba(253, 203, 66, 0.1)' : 'transparent',
//                               border: assignmentData.driverId === driver.user_id ? '2px solid #FDCB42' : 'none',
//                               borderRadius: 1,
//                               mb: 1,
//                               p: 1
//                             }}
//                           >
//                             <Avatar
//                               src={driver.profile_image}
//                               sx={{ width: 48, height: 48, bgcolor: '#FDCB42', mr: 2 }}
//                             >
//                               {!driver.profile_image && getInitials(driver.name)}
//                             </Avatar>
//                             <Box sx={{ flexGrow: 1 }}>
//                               <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
//                                 {driver.name}
//                               </Typography>
//                               <Typography variant="body2" color="text.secondary">
//                                 {driver.license_type} • {driver.experience_years} years • ⭐ {driver.rating}
//                               </Typography>
//                               <Typography variant="body2" color="text.secondary">
//                                 📱 {driver.phone}
//                               </Typography>
//                             </Box>
//                             <Chip
//                               label={driver.availability}
//                               size="small"
//                               color={driver.availability?.toLowerCase() === 'available' ? 'success' : 'default'}
//                               sx={{ ml: 1 }}
//                             />
//                             <Button
//                               variant={assignmentData.driverId === driver.user_id ? "contained" : "outlined"}
//                               size="small"
//                               startIcon={<PersonAdd />}
//                               onClick={() => handleDriverAssign(driver.user_id)}
//                               disabled={driver.availability?.toLowerCase() !== 'available'}
//                               sx={{
//                                 bgcolor: assignmentData.driverId === driver.user_id ? '#FDCB42' : 'transparent',
//                                 borderColor: '#FDCB42',
//                                 color: assignmentData.driverId === driver.user_id ? 'black' : '#FDCB42',
//                                 ml: 2,
//                                 '&:hover': {
//                                   bgcolor: assignmentData.driverId === driver.user_id ? '#fbbf24' : 'rgba(253, 203, 66, 0.1)'
//                                 }
//                               }}
//                             >
//                               {assignmentData.driverId === driver.user_id ? 'Selected' : 'Assign'}
//                             </Button>
//                           </Box>
//                         ))}
//                       </Box>
//                     </Paper>
//                   )}
//                 </Grid>

//                 <Grid item xs={12}>
//                   <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
//                     <DirectionsCar sx={{ mr: 1, color: '#FDCB42' }} />
//                     Select Vehicle ({availableVehicles.length} available)
//                   </Typography>
//                   {errors.vehicles && (
//                     <Alert severity="warning" sx={{ mb: 2 }}>
//                       {errors.vehicles}
//                     </Alert>
//                   )}
//                   {availableVehicles.length === 0 ? (
//                     <Alert severity="warning" sx={{ mb: 2 }}>
//                       No vehicles available for {requestData?.passenger_count || 1} passengers{requestData?.category ? ` in ${requestData.category} category` : ''}.
//                       <br />
//                       <Typography variant="body2" sx={{ mt: 1 }}>
//                         • Check vehicle availability status
//                         • Verify seating capacity requirements
//                         • Ensure vehicles are properly categorized
//                       </Typography>
//                     </Alert>
//                   ) : (
//                     <FormControl fullWidth error={!!errors.vehicleId}>
//                       <InputLabel>Available Vehicles</InputLabel>
//                       <Select
//                         value={assignmentData.vehicleId}
//                         label="Available Vehicles"
//                         onChange={(e) => handleInputChange('vehicleId', e.target.value)}
//                       >
//                         <MenuItem value="">
//                           <em>Select a vehicle</em>
//                         </MenuItem>
//                         {availableVehicles.map((vehicle, index) => (
//                           <MenuItem
//                             key={vehicle.vehicle_id}
//                             value={vehicle.vehicle_id}
//                             sx={{ py: 1 }}
//                           >
//                             <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
//                               <Avatar
//                                 variant="rounded"
//                                 sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}
//                               >
//                                 <DirectionsCar fontSize="small" />
//                               </Avatar>
//                               <Box sx={{ flexGrow: 1 }}>
//                                 <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
//                                   {vehicle.model || vehicle.vehicle_type}
//                                 </Typography>
//                                 <Typography variant="caption" color="text.secondary">
//                                   {vehicle.license_plate} • Capacity: {vehicle.seating_capacity} • {vehicle.category}
//                                 </Typography>
//                               </Box>
//                             </Box>
//                           </MenuItem>
//                         ))}
//                       </Select>
//                       {errors.vehicleId && (
//                         <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
//                           {errors.vehicleId}
//                         </Typography>
//                       )}
//                     </FormControl>
//                   )}
//                 </Grid>
//               </Grid>
//             )}
//           </Grid>

//           <Grid item xs={12} md={5}>
//             <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
//               <AttachMoney sx={{ mr: 1, color: '#FDCB42' }} />
//               Cost Breakdown
//             </Typography>
//             <Card sx={{ bgcolor: 'rgba(253, 203, 66, 0.05)', border: '1px solid #FDCB42' }}>
//               <CardContent>
//                 <TableContainer>
//                   <Table size="small">
//                     <TableBody>
//                       <TableRow>
//                         <TableCell sx={{ border: 'none', py: 0.5 }}>
//                           <Typography variant="body2">Fixed Rate:</Typography>
//                         </TableCell>
//                         <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
//                           <Typography variant="body2" fontWeight="bold">
//                             {formatCurrency(500)}
//                           </Typography>
//                         </TableCell>
//                       </TableRow>
//                       <TableRow>
//                         <TableCell sx={{ border: 'none', py: 0.5 }}>
//                           <Typography variant="body2">
//                             Distance ({distance} km × {formatCurrency(80)}/km):
//                           </Typography>
//                         </TableCell>
//                         <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
//                           <Typography variant="body2" fontWeight="bold">
//                             {formatCurrency(distance * 80)}
//                           </Typography>
//                         </TableCell>
//                       </TableRow>
//                       {requestData?.category && (
//                         <TableRow>
//                           <TableCell sx={{ border: 'none', py: 0.5 }}>
//                             <Typography variant="body2">
//                               {requestData.category} Category:
//                             </Typography>
//                           </TableCell>
//                           <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
//                             <Typography variant="body2" fontWeight="bold">
//                               {formatCurrency(
//                                 {
//                                   'Luxury': 3500,
//                                   'Safari': 2800,
//                                   'Tour': 2000,
//                                   'Adventure': 2200,
//                                   'Casual': 1500,
//                                   'Cultural': 1800,
//                                   'Business': 2500,
//                                   'Airport': 1200
//                                 }[requestData.category] || 1500
//                               )}
//                             </Typography>
//                           </TableCell>
//                         </TableRow>
//                       )}
//                       <TableRow>
//                         <TableCell sx={{ borderTop: '2px solid #FDCB42', py: 1 }}>
//                           <Typography variant="h6" fontWeight="bold" color="#FDCB42">
//                             Total Cost:
//                           </Typography>
//                         </TableCell>
//                         <TableCell align="right" sx={{ borderTop: '2px solid #FDCB42', py: 1 }}>
//                           <Typography variant="h6" fontWeight="bold" color="#FDCB42">
//                             {assignmentData.estimatedCost
//                               ? formatCurrency(assignmentData.estimatedCost)
//                               : formatCurrency(0)}
//                           </Typography>
//                         </TableCell>
//                       </TableRow>
//                     </TableBody>
//                   </Table>
//                 </TableContainer>
//               </CardContent>
//             </Card>
//           </Grid>

//           {assignmentData.driverId && assignmentData.vehicleId && assignmentData.estimatedCost && (
//             <Grid item xs={12}>
//               <Card sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50', mt: 2 }}>
//                 <CardContent>
//                   <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#4caf50' }}>
//                     <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
//                     Ready to Assign
//                   </Typography>
//                   <Grid container spacing={2}>
//                     <Grid item xs={12} md={4}>
//                       <Typography variant="subtitle2" gutterBottom>Selected Driver</Typography>
//                       {selectedDriver && (
//                         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                           <Avatar
//                             src={selectedDriver.profile_image}
//                             sx={{ width: 32, height: 32, mr: 1.5, bgcolor: '#FDCB42' }}
//                           >
//                             {!selectedDriver.profile_image && getInitials(selectedDriver.name)}
//                           </Avatar>
//                           <Box>
//                             <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
//                               {selectedDriver.name}
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                               {selectedDriver.license_type} • ⭐ {selectedDriver.rating}
//                             </Typography>
//                           </Box>
//                         </Box>
//                       )}
//                     </Grid>
//                     <Grid item xs={12} md={4}>
//                       <Typography variant="subtitle2" gutterBottom>Selected Vehicle</Typography>
//                       {selectedVehicle && (
//                         <Box>
//                           <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
//                             {selectedVehicle.model || selectedVehicle.vehicle_type}
//                           </Typography>
//                           <Typography variant="caption" color="text.secondary">
//                             {selectedVehicle.license_plate} • {selectedVehicle.category}
//                           </Typography>
//                         </Box>
//                       )}
//                     </Grid>
//                     <Grid item xs={12} md={4}>
//                       <Typography variant="subtitle2" gutterBottom>Total Cost</Typography>
//                       <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
//                         {formatCurrency(assignmentData.estimatedCost)}
//                       </Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         {distance} km • {requestData?.category || 'Standard'} category
//                       </Typography>
//                     </Grid>
//                   </Grid>
//                 </CardContent>
//               </Card>
//             </Grid>
//           )}
//         </Grid>
//       </DialogContent>

//       <DialogActions sx={{ p: 3, gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
//         <Button
//           onClick={onClose}
//           variant="outlined"
//           fullWidth={isMobile}
//         >
//           Cancel
//         </Button>
//         <Button
//           onClick={handleAssign}
//           variant="contained"
//           sx={{
//             bgcolor: '#FDCB42',
//             '&:hover': { bgcolor: '#fbbf24' },
//             fontWeight: 'bold'
//           }}
//           disabled={loading || !assignmentData.driverId || !assignmentData.vehicleId || !assignmentData.estimatedCost}
//           fullWidth={isMobile}
//         >
//           {loading ? 'Assigning...' : `Assign Trip - ${assignmentData.estimatedCost ? formatCurrency(assignmentData.estimatedCost) : 'LKR 0'}`}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default TripScheduler;


import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from '@mui/material';
import {
  LocationOn,
  DirectionsCar,
  Person,
  AttachMoney,
  Close as CloseIcon,
  Assignment,
  CheckCircle,
  CalendarToday,
  PersonAdd
} from '@mui/icons-material';
import UserService from '../../services/UserService';
import TripServices from '../../services/TripServices';

const TripScheduler = ({
  open,
  onClose,
  onSave,
  requestData = null,
  isMobile = false
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [assignmentData, setAssignmentData] = useState({
    driverId: '',
    vehicleId: '',
    estimatedCost: ''
  });

  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    if (open && requestData) {
      // Ensure default locations Colombo -> Badulla if missing
      if (!requestData.origin || !requestData.destination) {
        requestData.origin = requestData.origin || 'Colombo, Western Province, Sri Lanka';
        requestData.destination = requestData.destination || 'Badulla, Uva Province, Sri Lanka';
      }

      // Fix distance so cost remains consistent for Colombo -> Badulla
      const fixedColomboToBadullaKm = 230; // approximate road distance
      const initialDistance = requestData.origin?.toLowerCase().includes('colombo') && requestData.destination?.toLowerCase().includes('badulla')
        ? fixedColomboToBadullaKm
        : (requestData.estimated_distance_km || estimateDistance());

      setDistance(initialDistance);
      fetchAvailableResources();
      setAssignmentData({
        driverId: '',
        vehicleId: '',
        estimatedCost: ''
      });
    }
  }, [open, requestData]);

  useEffect(() => {
    if (assignmentData.driverId && assignmentData.vehicleId && distance) {
      const calculatedCost = calculateBasicCost();
      setAssignmentData(prev => ({
        ...prev,
        estimatedCost: calculatedCost.totalCost.toString()
      }));
    }
  }, [assignmentData.driverId, assignmentData.vehicleId, distance, requestData]);

  const estimateDistance = () => 230; // keep a stable estimate to maintain same cost


  const DUMMY_VEHICLES = [
  {
    vehicle_id: '0ddf30ab-9eba-4bfb-9d34-afe4f0e6c426',
    vehicle_type: 'Hilux',
    model: 'Toyota',
    year: '2005',
    seating_capacity: 3,
    color: 'Red',
    ownership: 'Nimnadi',
    registration_province: 'Banadarwela',
    license_plate: 'Rc4456y',
    chassis_no: 'vc-556',
    registration_date: '2022-02-14',
    expiry_date: '2029-10-31',
    insurance: 'Complete',
    category: 'Adventure',
    image_url: 'https://firebasestorage.googleapis.com/v0/b/imsystem-78316.appspot.com/o/VehicleProfile%2F1756718434306_hilux.jpg?alt=media&token=aa6f9808-48f0-4d27-9dbe-7b46fe5fffc7',
    created_at: '2025-08-19 21:58:23',
    availability: 'Available'
  },

];
  
  const fetchAvailableResources = async () => {
    try {
      setResourcesLoading(true);

      // Fetch assignment options using the enhanced API
      const response = await TripServices.getAssignmentOptions(requestData.trip_id, {
        vehicleType: requestData.vehicle_type,
        minSeatingCapacity: requestData.passenger_count
      });

      if (response.success) {
        const { drivers, vehicles } = response.data;
        
        // Format drivers data
        const driversData = drivers.map(driver => ({
          user_id: driver.driver_id,
          driver_id: driver.driver_id,
          name: `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'Unknown Driver',
          email: driver.email || '',
          profile_image: driver.profile_image || '',
          phone: driver.mobile || 'N/A',
          license_type: driver.license_type || 'Standard License',
          experience_years: driver.experience_years || 0,
          rating: driver.average_rating || 0,
          availability: driver.availability_status || 'available',
          current_latitude: driver.current_latitude,
          current_longitude: driver.current_longitude,
          is_online: driver.is_online || false
        }));

        // Format vehicles data
        const vehiclesData = vehicles.map(vehicle => ({
          vehicle_id: vehicle.vehicle_id,
          vehicle_type: vehicle.vehicle_type,
          model: vehicle.model,
          year: vehicle.year,
          seating_capacity: vehicle.seating_capacity,
          color: vehicle.color,
          license_plate: vehicle.license_plate,
          category: vehicle.category || 'Standard',
          availability: vehicle.availability_status || 'available',
          image_url: vehicle.image_url || ''
        }));

        setAvailableDrivers(driversData);
        setAvailableVehicles(vehiclesData);

        if (driversData.length === 0) {
          setErrors(prev => ({
            ...prev,
            drivers: 'No drivers available at the moment.'
          }));
        }

        if (vehiclesData.length === 0) {
          setErrors(prev => ({
            ...prev,
            vehicles: 'No vehicles available for this trip.'
          }));
        }
      } else {
        throw new Error(response.message || 'Failed to fetch assignment options');
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setErrors(prev => ({
        ...prev,
        fetch: 'Failed to load available drivers and vehicles. Please try again.'
      }));
      setAvailableDrivers([]);
      setAvailableVehicles([]);
    } finally {
      setResourcesLoading(false);
    }
  };

  // Enhanced cost calculation using the new pricing system
  const calculateBasicCost = () => {
    // Base fares for different trip categories (in LKR)
    const categoryBaseFares = {
      'Luxury': 5000,      // Premium base fare
      'Safari': 3500,      // Wildlife/nature trips
      'Tour': 2000,        // Standard sightseeing
      'Adventure': 3000,   // Hiking/outdoor activities
      'Casual': 1500       // Simple transfers
    };

    // Per km rates for different categories (in LKR)
    const categoryDistanceRates = {
      'Luxury': 100,       // Premium per km rate
      'Safari': 80,        // Higher rate for remote areas
      'Tour': 60,          // Standard sightseeing rate
      'Adventure': 70,     // Outdoor activity rate
      'Casual': 40         // Basic transfer rate
    };

    // Per hour rates for different categories (in LKR)
    const categoryTimeRates = {
      'Luxury': 800,       // Premium hourly rate
      'Safari': 600,       // Wildlife viewing time
      'Tour': 400,         // Standard tour rate
      'Adventure': 500,    // Outdoor activity time
      'Casual': 300        // Basic hourly rate
    };
    
    // Vehicle type multipliers
    const vehicleMultipliers = {
      'economy': 1.0,
      'luxury': 1.5,
      'van': 1.3,
      'minibus': 1.4,
      'bus': 1.2,
      'any': 1.0
    };
    
    const tripCategory = requestData?.category || 'Casual';
    const vehicleType = requestData?.vehicle_type || 'any';
    
    // Get rates for the selected category
    const baseFare = categoryBaseFares[tripCategory] || categoryBaseFares['Casual'];
    const distanceRate = categoryDistanceRates[tripCategory] || categoryDistanceRates['Casual'];
    const timeRate = categoryTimeRates[tripCategory] || categoryTimeRates['Casual'];
    
    const vehicleMultiplier = vehicleMultipliers[vehicleType] || 1.0;
    
    // Calculate estimated duration based on distance and category
    const categorySpeeds = {
      'Luxury': 60,      // km/h - comfortable pace
      'Safari': 30,      // km/h - slow for wildlife viewing
      'Tour': 50,        // km/h - moderate pace for sightseeing
      'Adventure': 40,   // km/h - slower for outdoor activities
      'Casual': 55       // km/h - normal driving speed
    };
    
    const stopMultipliers = {
      'Luxury': 1.5,     // More stops for luxury experience
      'Safari': 2.0,     // Many stops for wildlife viewing
      'Tour': 1.8,       // Frequent stops for sightseeing
      'Adventure': 1.3,  // Some stops for activities
      'Casual': 1.1      // Minimal stops
    };
    
    const speed = categorySpeeds[tripCategory] || 50;
    const baseHours = distance / speed;
    const multiplier = stopMultipliers[tripCategory] || 1.1;
    const estimatedDuration = Math.round(baseHours * multiplier * 10) / 10;
    
    // Calculate individual components
    const distanceFare = distance * distanceRate;
    const timeFare = estimatedDuration * timeRate;
    
    // Calculate subtotal before vehicle multiplier
    const subtotal = baseFare + distanceFare + timeFare;
    
    // Apply vehicle multiplier
    const vehicleAdjustedAmount = subtotal * vehicleMultiplier;
    
    // Add passenger surcharge for more than 4 passengers
    const passengerSurcharge = (requestData?.passenger_count || 1) > 4 ? 
      ((requestData.passenger_count || 1) - 4) * 200 : 0;
    
    const totalCost = vehicleAdjustedAmount + passengerSurcharge;

    return {
      baseFare: Math.round(baseFare),
      distanceFare: Math.round(distanceFare),
      timeFare: Math.round(timeFare),
      vehicleMultiplier,
      vehicleAdjustedAmount: Math.round(vehicleAdjustedAmount),
      passengerSurcharge,
      categoryName: tripCategory,
      totalCost: Math.round(totalCost),
      rates: {
        distanceRate,
        timeRate
      },
      distance,
      duration: estimatedDuration
    };
  };

  const handleDriverAssign = (driverId) => {
    setAssignmentData(prev => ({
      ...prev,
      driverId: driverId
    }));
    if (errors.driverId) {
      setErrors(prev => ({
        ...prev,
        driverId: undefined
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setAssignmentData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!assignmentData.driverId) newErrors.driverId = 'Driver selection is required';
    if (!assignmentData.vehicleId) newErrors.vehicleId = 'Vehicle selection is required';
    if (!assignmentData.estimatedCost) newErrors.estimatedCost = 'Estimated cost is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAssign = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      
      // Use the enhanced assignment API
      const assignmentPayload = {
        driverId: assignmentData.driverId,
        vehicleId: assignmentData.vehicleId,
        estimatedCost: parseFloat(assignmentData.estimatedCost),
        estimatedDuration: Math.ceil(distance / 50) * 60, // Estimate duration in minutes
        notes: `Trip assigned via TripScheduler - ${requestData.category} trip`
      };

      const response = await TripServices.assignTripToDriverEnhanced(
        requestData.trip_id, 
        assignmentPayload
      );

      if (response.success) {
        setSuccess('Trip assigned successfully!');
        // Call the parent onSave callback with the response data
        await onSave(response.data);
        onClose();
      } else {
        throw new Error(response.message || 'Failed to assign trip');
      }
    } catch (error) {
      console.error('Assignment error:', error);
      setErrors({ submit: error.message || 'Failed to assign trip. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const formatCurrency = (amount) => new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(amount));

  const formatDateTime = (date, time) => {
    if (!date || !time) return 'Not specified';
    try {
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      return `${formattedDate} at ${time}`;
    } catch {
      return `${date} at ${time}`;
    }
  };

  const formatLocation = (location) => {
    if (!location) return 'Not specified';
    return location.length > 30 ? `${location.substring(0, 30)}...` : location;
  };

  // Get selected driver and vehicle for summary
  const selectedDriver = availableDrivers.find(d => (d.user_id || d.driver_id) === assignmentData.driverId);
  const selectedVehicle = availableVehicles.find(v => v.vehicle_id === assignmentData.vehicleId);

  if (!requestData) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isSmallScreen}
      PaperProps={{
        sx: {
          minHeight: isSmallScreen ? '100vh' : '80vh',
          m: isSmallScreen ? 0 : 2
        }
      }}
    >
      <DialogTitle sx={{
        bgcolor: '#FDCB42',
        color: 'black',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Assignment sx={{ mr: 1 }} />
          Assign Trip to Driver & Vehicle
        </Box>
        {isSmallScreen && (
          <IconButton onClick={onClose} sx={{ color: 'black' }}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}
        {errors.fetch && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.fetch}
          </Alert>
        )}

        <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#FDCB42', fontWeight: 'bold', mb: 2 }}>
              Trip Overview - {requestData?.category || 'Standard'} Trip
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarToday sx={{ mr: 1, color: 'primary.main', fontSize: 16 }} />
                  <strong>{formatDateTime(requestData.preferred_date, requestData.preferred_time)}</strong>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1, color: 'info.main', fontSize: 16 }} />
                  <strong>{requestData.passenger_count || 1} passengers</strong> • {requestData.contact_name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ mr: 1, color: 'success.main', fontSize: 16 }} />
                  <strong>From:</strong> {formatLocation(requestData.origin)}
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ mr: 1, color: 'error.main', fontSize: 16 }} />
                  <strong>To:</strong> {formatLocation(requestData.destination)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          {resourcesLoading ? (
            <Box display="flex" alignItems="center" gap={2} justifyContent="center" py={4}>
              <CircularProgress size={20} />
              <Typography variant="body2">Loading available resources...</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Person sx={{ mr: 1, color: '#FDCB42' }} />
                  Available Drivers ({availableDrivers.length})
                </Typography>
                {errors.drivers && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {errors.drivers}
                  </Alert>
                )}
                {availableDrivers.length === 0 ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No drivers available at the moment.
                    <br />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      • Ensure drivers are marked as available
                      • Consider expanding search criteria
                    </Typography>
                  </Alert>
                ) : (
                  <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <Box>
                      {availableDrivers.map((driver, index) => (
                        <Box
                          key={driver.user_id || driver.driver_id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: assignmentData.driverId === (driver.user_id || driver.driver_id) ? 'rgba(253, 203, 66, 0.1)' : 'transparent',
                            border: assignmentData.driverId === (driver.user_id || driver.driver_id) ? '2px solid #FDCB42' : '1px solid #e0e0e0',
                            borderRadius: 1,
                            mb: 1,
                            p: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'rgba(253, 203, 66, 0.05)'
                            }
                          }}
                          onClick={() => handleDriverAssign(driver.user_id || driver.driver_id)}
                        >
                          <Avatar
                            src={driver.profile_image}
                            sx={{ width: 48, height: 48, bgcolor: '#FDCB42', mr: 2 }}
                          >
                            {!driver.profile_image && getInitials(driver.name)}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {driver.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {driver.license_type} • {driver.experience_years} years • ⭐ {driver.rating}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {driver.phone}
                            </Typography>
                          </Box>
                          <Chip
                            label={driver.availability}
                            size="small"
                            color={driver.availability?.toLowerCase() === 'available' ? 'success' : 'default'}
                            sx={{ ml: 1 }}
                          />
                          <Button
                            variant={assignmentData.driverId === (driver.user_id || driver.driver_id) ? "contained" : "outlined"}
                            size="small"
                            startIcon={<PersonAdd />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDriverAssign(driver.user_id || driver.driver_id);
                            }}
                            disabled={driver.availability?.toLowerCase() !== 'available'}
                            sx={{
                              bgcolor: assignmentData.driverId === (driver.user_id || driver.driver_id) ? '#FDCB42' : 'transparent',
                              borderColor: '#FDCB42',
                              color: assignmentData.driverId === (driver.user_id || driver.driver_id) ? 'black' : '#FDCB42',
                              ml: 2,
                              fontWeight: assignmentData.driverId === (driver.user_id || driver.driver_id) ? 'bold' : 'normal',
                              '&:hover': {
                                bgcolor: assignmentData.driverId === (driver.user_id || driver.driver_id) ? '#fbbf24' : 'rgba(253, 203, 66, 0.1)'
                              }
                            }}
                          >
                            {assignmentData.driverId === (driver.user_id || driver.driver_id) ? 'Selected' : 'Assign'}
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <DirectionsCar sx={{ mr: 1, color: '#FDCB42' }} />
                  Select Vehicle ({availableVehicles.length} available)
                </Typography>
                {errors.vehicles && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {errors.vehicles}
                  </Alert>
                )}
                {availableVehicles.length === 0 ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No vehicles available for this trip.
                  </Alert>
                ) : (
                  <FormControl fullWidth error={!!errors.vehicleId}>
                    <InputLabel>Available Vehicles</InputLabel>
                    <Select
                      value={assignmentData.vehicleId}
                      label="Available Vehicles"
                      onChange={(e) => handleInputChange('vehicleId', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a vehicle</em>
                      </MenuItem>
                      {availableVehicles.map((vehicle, index) => (
                        <MenuItem
                          key={vehicle.vehicle_id}
                          value={vehicle.vehicle_id}
                          sx={{
                            py: 1,
                            bgcolor: assignmentData.vehicleId === vehicle.vehicle_id ? 'rgba(253, 203, 66, 0.1)' : 'transparent',
                            fontWeight: assignmentData.vehicleId === vehicle.vehicle_id ? 'bold' : 'normal',
                            '&:hover': {
                              bgcolor: assignmentData.vehicleId === vehicle.vehicle_id ? 'rgba(253, 203, 66, 0.2)' : 'rgba(253, 203, 66, 0.05)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Avatar
                              variant="rounded"
                              src={vehicle.image_url}
                              sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}
                            >
                              <DirectionsCar fontSize="small" />
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {vehicle.model || vehicle.vehicle_type}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {vehicle.license_plate} • Capacity: {vehicle.seating_capacity} • {vehicle.category}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.vehicleId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.vehicleId}
                      </Typography>
                    )}
                  </FormControl>
                )}
              </Grid>
            </Grid>
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <AttachMoney sx={{ mr: 1, color: '#FDCB42' }} />
            Cost Breakdown
          </Typography>
          <Card sx={{ bgcolor: 'rgba(253, 203, 66, 0.05)', border: '1px solid #FDCB42' }}>
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {(() => {
                      const costBreakdown = calculateBasicCost();
                      return (
                        <>
                          <TableRow>
                            <TableCell sx={{ border: 'none', py: 0.5 }}>
                              <Typography variant="body2">Base Fare:</Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {formatCurrency(costBreakdown.baseFare)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ border: 'none', py: 0.5 }}>
                              <Typography variant="body2">
                                Distance ({costBreakdown.distance} km @ LKR {costBreakdown.rates.distanceRate}/km):
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {formatCurrency(costBreakdown.distanceFare)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ border: 'none', py: 0.5 }}>
                              <Typography variant="body2">
                                Time ({costBreakdown.duration} hrs @ LKR {costBreakdown.rates.timeRate}/hr):
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {formatCurrency(costBreakdown.timeFare)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                          {costBreakdown.vehicleMultiplier > 1 && (
                            <TableRow>
                              <TableCell sx={{ border: 'none', py: 0.5 }}>
                                <Typography variant="body2">
                                  Vehicle Type (x{costBreakdown.vehicleMultiplier}):
                                </Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {formatCurrency(costBreakdown.vehicleAdjustedAmount)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                          {costBreakdown.passengerSurcharge > 0 && (
                            <TableRow>
                              <TableCell sx={{ border: 'none', py: 0.5 }}>
                                <Typography variant="body2">Passenger Surcharge:</Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {formatCurrency(costBreakdown.passengerSurcharge)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow>
                            <TableCell sx={{ borderTop: '2px solid #FDCB42', py: 1 }}>
                              <Typography variant="h6" fontWeight="bold" color="#FDCB42">
                                Total Cost: 
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ borderTop: '2px solid #FDCB42', py: 1 }}>
                              <Typography variant="h6" fontWeight="bold" color="#FDCB42">
                                {formatCurrency(costBreakdown.totalCost)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </>
                      );
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {assignmentData.driverId && assignmentData.vehicleId && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50', mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                  <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Ready to Assign
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>Selected Driver</Typography>
                    {selectedDriver && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={selectedDriver.profile_image}
                          sx={{ width: 32, height: 32, mr: 1.5, bgcolor: '#FDCB42' }}
                        >
                          {!selectedDriver.profile_image && getInitials(selectedDriver.name)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {selectedDriver.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedDriver.license_type} • ⭐ {selectedDriver.rating}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>Selected Vehicle</Typography>
                    {selectedVehicle && (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {selectedVehicle.model || selectedVehicle.vehicle_type}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedVehicle.license_plate} • {selectedVehicle.category}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>Total Cost</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {formatCurrency(calculateBasicCost().totalCost)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {distance} km • {requestData?.category || 'Standard'} category
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth={isMobile}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          sx={{
            bgcolor: '#FDCB42',
            '&:hover': { bgcolor: '#fbbf24' },
            fontWeight: 'bold'
          }}
          disabled={loading || !assignmentData.driverId || !assignmentData.vehicleId}
          fullWidth={isMobile}
        >
          {loading ? 'Assigning...' : `Assign Trip - ${formatCurrency(calculateBasicCost().totalCost)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TripScheduler;