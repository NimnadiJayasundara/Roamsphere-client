import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './components/authentication/Login'
import Signup from './components/authentication/Signup'
import OTPVerification from './components/authentication/otpVerification'
import SetPassword from './components/authentication/SetPassword'
import Dashboard from './pages/Dashboard'
import AddVehicle from './pages/AddVehicle'
import AddDriver from './pages/AddDriver'

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
      </Routes>
    </div>
  )
}

export default App