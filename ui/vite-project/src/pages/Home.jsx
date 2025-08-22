import React from "react";

// Home.jsx
export default function Home({ user }) {
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
        <h3>Welcome bhai, kr liya na GitHub se login tune </h3>
      )}
    </div>
  );
}
