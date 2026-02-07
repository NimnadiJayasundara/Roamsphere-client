import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Stack,
  Paper
} from '@mui/material';
import {
  CreditCard,
  AccountBalance,
  PhoneAndroid,
  AttachMoney,
  Security,
  CheckCircle
} from '@mui/icons-material';
import PaymentService from '../../services/PaymentService';

const PaymentStep = ({ 
  tripData, 
  onPaymentSuccess, 
  onPaymentError, 
  isMobile 
}) => {
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    bankName: '',
    branchCode: ''
  });
  const [mobileDetails, setMobileDetails] = useState({
    phoneNumber: '',
    provider: 'dialog'
  });
  const [costEstimate, setCostEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [errors, setErrors] = useState({});

  const paymentMethods = [
    {
      value: 'card',
      label: 'Credit/Debit Card',
      icon: <CreditCard />,
      description: 'Visa, Mastercard, American Express'
    },
    {
      value: 'bank',
      label: 'Bank Transfer',
      icon: <AccountBalance />,
      description: 'Direct bank transfer'
    },
    {
      value: 'mobile',
      label: 'Mobile Payment',
      icon: <PhoneAndroid />,
      description: 'Dialog, Mobitel, Hutch'
    }
  ];

  const mobileProviders = [
    { value: 'dialog', label: 'Dialog' },
    { value: 'mobitel', label: 'Mobitel' },
    { value: 'hutch', label: 'Hutch' },
    { value: 'airtel', label: 'Airtel' }
  ];

  useEffect(() => {
    calculateCost();
  }, [tripData]);

  const calculateCost = async () => {
    try {
      setCalculating(true);
      const response = await PaymentService.calculateTripCost(tripData);
      setCostEstimate(response);
    } catch (error) {
      console.error('Error calculating cost:', error);
      // Set default cost if calculation fails
      setCostEstimate({
        baseAmount: 5000,
        distance: 50,
        duration: 2,
        totalAmount: 5000,
        breakdown: {
          baseFare: 2000,
          distanceFare: 2000,
          timeFare: 1000
        }
      });
    } finally {
      setCalculating(false);
    }
  };

  const validateCardDetails = () => {
    const newErrors = {};
    
    if (!cardDetails.cardNumber || cardDetails.cardNumber.length < 16) {
      newErrors.cardNumber = 'Valid card number required';
    }
    if (!cardDetails.expiryDate || !/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
      newErrors.expiryDate = 'Valid expiry date (MM/YY) required';
    }
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      newErrors.cvv = 'Valid CVV required';
    }
    if (!cardDetails.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBankDetails = () => {
    const newErrors = {};
    
    if (!bankDetails.accountNumber || bankDetails.accountNumber.length < 8) {
      newErrors.accountNumber = 'Valid account number required';
    }
    if (!bankDetails.bankName.trim()) {
      newErrors.bankName = 'Bank name required';
    }
    if (!bankDetails.branchCode.trim()) {
      newErrors.branchCode = 'Branch code required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateMobileDetails = () => {
    const newErrors = {};
    
    if (!mobileDetails.phoneNumber || !/^0\d{9}$/.test(mobileDetails.phoneNumber)) {
      newErrors.phoneNumber = 'Valid phone number required (0XXXXXXXXX)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    let isValid = false;
    
    switch (selectedMethod) {
      case 'card':
        isValid = validateCardDetails();
        break;
      case 'bank':
        isValid = validateBankDetails();
        break;
      case 'mobile':
        isValid = validateMobileDetails();
        break;
      default:
        isValid = false;
    }

    if (!isValid) return;

    try {
      setLoading(true);
      
      // Create payment intent
      const paymentData = {
        method: selectedMethod,
        amount: costEstimate.totalAmount,
        tripData,
        paymentDetails: selectedMethod === 'card' ? cardDetails : 
                       selectedMethod === 'bank' ? bankDetails : 
                       mobileDetails
      };

      const response = await PaymentService.createPaymentIntent(paymentData, costEstimate.totalAmount);
      
      if (response.success) {
        onPaymentSuccess(response);
      } else {
        onPaymentError(response.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError(error.response?.data?.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (calculating) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress size={40} sx={{ color: '#FDCB42' }} />
        <Typography variant="body1" sx={{ ml: 2 }}>Calculating trip cost...</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={isMobile ? 2 : 3}>
      {/* Cost Summary */}
      <Grid item xs={12}>
        <Card sx={{ bgcolor: 'rgba(253, 203, 66, 0.05)', border: '1px solid rgba(253, 203, 66, 0.3)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#FDCB42' }}>
              Trip Cost Summary
            </Typography>
            {costEstimate && (
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Base Fare:</Typography>
                  <Typography variant="body2">LKR {costEstimate.breakdown?.baseFare?.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Distance ({costEstimate.distance} km @ LKR {costEstimate.breakdown?.rates?.distanceRate}/km):</Typography>
                  <Typography variant="body2">LKR {costEstimate.breakdown?.distanceFare?.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Time ({costEstimate.duration} hrs @ LKR {costEstimate.breakdown?.rates?.timeRate}/hr):</Typography>
                  <Typography variant="body2">LKR {costEstimate.breakdown?.timeFare?.toLocaleString()}</Typography>
                </Box>
                {costEstimate.breakdown?.vehicleMultiplier > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Vehicle Type (x{costEstimate.breakdown?.vehicleMultiplier}):</Typography>
                    <Typography variant="body2">LKR {costEstimate.breakdown?.vehicleAdjustedAmount?.toLocaleString()}</Typography>
                  </Box>
                )}
                {costEstimate.breakdown?.passengerSurcharge > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Passenger Surcharge:</Typography>
                    <Typography variant="body2">LKR {costEstimate.breakdown?.passengerSurcharge?.toLocaleString()}</Typography>
                  </Box>
                )}
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total Amount:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FDCB42' }}>
                    LKR {costEstimate.totalAmount?.toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Payment Method Selection */}
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Select Payment Method
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
          >
            <Grid container spacing={2}>
              {paymentMethods.map((method) => (
                <Grid item xs={12} md={4} key={method.value}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedMethod === method.value ? '2px solid #FDCB42' : '1px solid #e0e0e0',
                      bgcolor: selectedMethod === method.value ? 'rgba(253, 203, 66, 0.05)' : 'white'
                    }}
                    onClick={() => setSelectedMethod(method.value)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <FormControlLabel
                        value={method.value}
                        control={<Radio />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            {method.icon}
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                {method.label}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {method.description}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </RadioGroup>
        </FormControl>
      </Grid>

      {/* Payment Details Forms */}
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Payment Details
        </Typography>
        
        {selectedMethod === 'card' && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Card Number"
                value={cardDetails.cardNumber}
                onChange={(e) => setCardDetails(prev => ({ 
                  ...prev, 
                  cardNumber: formatCardNumber(e.target.value) 
                }))}
                error={!!errors.cardNumber}
                helperText={errors.cardNumber}
                placeholder="1234 5678 9012 3456"
                size={isMobile ? "small" : "medium"}
                inputProps={{ maxLength: 19 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                value={cardDetails.expiryDate}
                onChange={(e) => setCardDetails(prev => ({ 
                  ...prev, 
                  expiryDate: formatExpiryDate(e.target.value) 
                }))}
                error={!!errors.expiryDate}
                helperText={errors.expiryDate}
                placeholder="MM/YY"
                size={isMobile ? "small" : "medium"}
                inputProps={{ maxLength: 5 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CVV"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails(prev => ({ 
                  ...prev, 
                  cvv: e.target.value.replace(/\D/g, '').substring(0, 4) 
                }))}
                error={!!errors.cvv}
                helperText={errors.cvv}
                placeholder="123"
                size={isMobile ? "small" : "medium"}
                inputProps={{ maxLength: 4 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cardholder Name"
                value={cardDetails.cardholderName}
                onChange={(e) => setCardDetails(prev => ({ 
                  ...prev, 
                  cardholderName: e.target.value 
                }))}
                error={!!errors.cardholderName}
                helperText={errors.cardholderName}
                placeholder="John Doe"
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
          </Grid>
        )}

        {selectedMethod === 'bank' && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Account Number"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails(prev => ({ 
                  ...prev, 
                  accountNumber: e.target.value.replace(/\D/g, '') 
                }))}
                error={!!errors.accountNumber}
                helperText={errors.accountNumber}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bank Name"
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails(prev => ({ 
                  ...prev, 
                  bankName: e.target.value 
                }))}
                error={!!errors.bankName}
                helperText={errors.bankName}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Branch Code"
                value={bankDetails.branchCode}
                onChange={(e) => setBankDetails(prev => ({ 
                  ...prev, 
                  branchCode: e.target.value 
                }))}
                error={!!errors.branchCode}
                helperText={errors.branchCode}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
          </Grid>
        )}

        {selectedMethod === 'mobile' && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <TextField
                  select
                  label="Mobile Provider"
                  value={mobileDetails.provider}
                  onChange={(e) => setMobileDetails(prev => ({ 
                    ...prev, 
                    provider: e.target.value 
                  }))}
                >
                  {mobileProviders.map((provider) => (
                    <option key={provider.value} value={provider.value}>
                      {provider.label}
                    </option>
                  ))}
                </TextField>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={mobileDetails.phoneNumber}
                onChange={(e) => setMobileDetails(prev => ({ 
                  ...prev, 
                  phoneNumber: e.target.value.replace(/\D/g, '').substring(0, 10) 
                }))}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber}
                placeholder="0XXXXXXXXX"
                size={isMobile ? "small" : "medium"}
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
          </Grid>
        )}
      </Grid>

      {/* Security Notice */}
      <Grid item xs={12}>
        <Alert 
          severity="info" 
          icon={<Security />}
          sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)' }}
        >
          <Typography variant="body2">
            <strong>Secure Payment:</strong> Your payment information is encrypted and processed securely. 
            We do not store your card details.
          </Typography>
        </Alert>
      </Grid>

      {/* Payment Button */}
      <Grid item xs={12}>
        <Button
          fullWidth
          variant="contained"
          onClick={handlePayment}
          disabled={loading || !costEstimate}
          startIcon={loading ? <CircularProgress size={20} /> : <AttachMoney />}
          sx={{
            bgcolor: '#FDCB42',
            color: 'black',
            py: 2,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#FFD700' },
            '&:disabled': { bgcolor: '#ccc' }
          }}
        >
          {loading ? 'Processing Payment...' : `Pay LKR ${costEstimate?.totalAmount?.toLocaleString()}`}
        </Button>
      </Grid>
    </Grid>
  );
};

export default PaymentStep;
