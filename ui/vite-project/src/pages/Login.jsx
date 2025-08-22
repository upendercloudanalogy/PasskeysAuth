// Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Helper: convert base64url string to Uint8Array
function base64urlToBuffer(base64url) {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const str = atob(base64);
  const buffer = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) buffer[i] = str.charCodeAt(i);
  return buffer;
}

export default function Login({ setUser }) {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleGithubLogin = () => {
    window.location.href = "http://localhost:3000/auth/github";
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault(); // prevent form submission if inside form
    setMessage(""); // clear previous messages
    try {
      console.log("Starting login process...");

      // 1️⃣ Request authentication options
      const res = await fetch("http://localhost:3000/auth/login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const options = await res.json();
      console.log("Login options received:", options);

      // 2️⃣ Convert challenge and allowCredentials to Uint8Array
      options.challenge = base64urlToBuffer(options.challenge);
      if (options.allowCredentials) {
        options.allowCredentials = options.allowCredentials.map((cred) => ({
          ...cred,
          id: base64urlToBuffer(cred.id),
        }));
      }

      // 3️⃣ Call WebAuthn API
      console.log("Calling navigator.credentials.get...");
      const assertion = await navigator.credentials.get({ publicKey: options });
      console.log("Assertion received:", assertion);

      // 4️⃣ Prepare credential for backend
      const credential = {
        id: assertion.id,
        type: assertion.type,
        rawId: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=/g, ""),
        response: {
          authenticatorData: btoa(
            String.fromCharCode(...new Uint8Array(assertion.response.authenticatorData))
          )
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, ""),
          clientDataJSON: btoa(
            String.fromCharCode(...new Uint8Array(assertion.response.clientDataJSON))
          )
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, ""),
          signature: btoa(
            String.fromCharCode(...new Uint8Array(assertion.response.signature))
          )
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, ""),
          userHandle: assertion.response.userHandle
            ? btoa(String.fromCharCode(...new Uint8Array(assertion.response.userHandle)))
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=/g, "")
            : null,
        },
      };

      // 5️⃣ Send assertion to backend
      const verifyRes = await fetch("http://localhost:3000/auth/login/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });
      const result = await verifyRes.json();
      console.log("Verification result:", result);

      if (result.verified) {
        console.log("Login successful, user:", result.user);
        setUser(result.user);
        navigate("/home"); // SPA redirect without reload
      } else {
        console.log("Login failed");
        setMessage("Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage("Error during login: " + err.message);
    }
  };

  return (
    <div>
      <h1>Login with Passkey</h1>
      <button type="button" onClick={handleLogin}>
        Login with Passkey
      </button>
         {/* NEW: GitHub button */}
      <button type="button" onClick={handleGithubLogin} style={{ marginLeft: 12 }}>
        Login with GitHub
      </button>
      <p>{message}</p>
    </div>
  );
}
