import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './components/authentication/Login'
import Signup from './components/authentication/Signup'
import OTPVerification from './components/authentication/otpVerification'
import SetPassword from './components/authentication/SetPassword'
import Dashboard from './pages/Dashboard'
import AddVehicle from './pages/vehiclePages/AddVehicle'
import AddDriver from './pages/driverPages/AddDriver'

import VehicleList from './pages/vehiclePages/VehicleList'
import DriverLeaderboard from './pages/driverPages/DriverLeaderboard'
import TripSchedule from './pages/tripPages/TripsSchedule'
import TrackLocation from './pages/tripPages/TrackLocation'
import MenuSettings from './pages/settingsPages/MenuSettings'
import TourOperatorDashboard from './pages/Dashboard/TODashboard'
import DriverDashboard from './pages/driverPages/DriverDashboard'

function App() {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/users' element={<Dashboard />} />
        <Route path='/login' element={<Login/>} />
        <Route path='/signup' element={<Signup/>}/>
        <Route path='/verifyotp' element={<OTPVerification />} />
        <Route path='/setpassword' element={<SetPassword />} />
        <Route path='/addvehicle' element={<AddVehicle/>} />
        <Route path='/adddriver' element={<AddDriver/>} />

        <Route path='/vehiclelist' element={<VehicleList/>} />
        <Route path='/driver-leaderboard' element={<DriverLeaderboard/>} />
        <Route path='/trip-schedule' element={<TripSchedule/>} />
        <Route path='/track-location' element={<TrackLocation/>} />
        <Route path='/menu-settings' element={<MenuSettings/>} />
        <Route path='/tour-operator-dashboard' element={<TourOperatorDashboard/>} />
        <Route path='/driver-dashboard' element={<DriverDashboard/>} />
      </Routes>
    </div>
  )
}

export default App