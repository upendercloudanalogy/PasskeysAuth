import React from "react";
import { useNavigate } from "react-router-dom";
// Home.jsx
export default function Home({ user }) {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/plans");
  }
  return (
    <div>
      {user ? (
        <>
          <h1>Welcome, {user.username}!</h1>
          <p>ID: {user.id}</p>
          <p>Name: {user.display_name}</p>
          <p>Joined: {user.created_at}</p>
        </>
      ) : (
        <h3>Welcome bhai</h3>
      )}

      <button onClick={handleClick}>PREMIUM PLANS</button>
    </div>
  );
}
