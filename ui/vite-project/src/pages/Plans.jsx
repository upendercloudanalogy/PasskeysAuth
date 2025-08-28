import React, { useState } from "react";

export default function PaymentMethods() {
  const [loading, setLoading] = useState(false);

  const handlePayPalPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: "10.00" }),
      });

      const result = await res.json();

      if (result.success && result.approvalUrl) {
        // Redirect to PayPal approval page
        window.location.href = result.approvalUrl;
      } else {
        alert(`Payment failed: ${result.error}`);
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Select Your Payment Method</h2>

      <button 
        onClick={handlePayPalPayment} 
        disabled={loading}
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? "Processing..." : "Pay with PayPal"}
      </button>
    </div>
  );
}
