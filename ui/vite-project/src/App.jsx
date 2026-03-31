import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Plans from "./pages/Plans";
import Cookies from "js-cookie";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";


export default function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      
      <Routes>
        <Route path="/" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/home"
          element={<Home user={user} />}
        />
        <Route path="/plans" element={<Plans/>} />
         <Route path="/payment/success" element={<PaymentSuccess />} />
           <Route path="/payment/cancel" element={<PaymentCancel />} />
        
      </Routes>
    </BrowserRouter>
  );
}
