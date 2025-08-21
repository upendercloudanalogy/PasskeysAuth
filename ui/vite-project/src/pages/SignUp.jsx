import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";

// Helper to convert base64url string → Uint8Array
function base64urlToUint8Array(base64url) {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");

  const handleSignUp = async () => {
    try {
      const userId = uuidv4();

      // 1️⃣ Start registration
      const res = await fetch("http://localhost:3000/auth/register/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          username,
          displayName: displayName || username,
        }),
      });

      const options = await res.json();

      // 2️⃣ Convert challenge and excludeCredentials IDs to Uint8Array
      options.challenge = base64urlToUint8Array(options.challenge);
      options.user.id = base64urlToUint8Array(options.user.id);

      if (options.excludeCredentials) {
  options.excludeCredentials = options.excludeCredentials.map((cred) => ({
    ...cred,
    id: base64urlToUint8Array(cred.id),
  }));
}
      // 3️⃣ Call WebAuthn API
      const credential = await navigator.credentials.create({ publicKey: options });

      // 4️⃣ Convert ArrayBuffer responses to base64url for backend
      const attestationResponse = {
        id: credential.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=/g, ""),
        type: credential.type,
        response: {
          attestationObject: btoa(
            String.fromCharCode(...new Uint8Array(credential.response.attestationObject))
          )
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, ""),
          clientDataJSON: btoa(
            String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))
          )
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, ""),
        },
        transports: credential.response.getTransports?.() || [],
      };

      // 5️⃣ Finish registration - send only the credential response
      const verifyRes = await fetch("http://localhost:3000/auth/register/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
       body: JSON.stringify(attestationResponse),
});

      const result = await verifyRes.json();

      if (result.verified) {
        setMessage("Sign up successful! You can login now.");
      } else {
        setMessage("Sign up failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error during sign up: " + err.message);
    }
  };

  return (
    <div>
      <h1>Sign Up with Passkey</h1>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        placeholder="Display Name (optional)"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <button onClick={handleSignUp}>Sign Up</button>
      <p>{message}</p>
    </div>
  );
}