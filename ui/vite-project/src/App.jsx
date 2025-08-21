import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Home from "./pages/Home";

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Login</Link> | <Link to="/signup">Sign Up</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/home"
          element={user ? <Home user={user} /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}
