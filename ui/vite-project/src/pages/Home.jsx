import React from "react";

// Home.jsx
export default function Home({ user }) {
  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <p>ID: {user.id}</p>
      <p>Name: {user.display_name}</p>
      <p>Joined: {user.created_at}</p>
    </div>
  );
}
