// pages/PaymentCancel.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Payment Cancelled</h2>
      <p>Your payment was cancelled. You can try again anytime.</p>
      <button onClick={() => navigate('/plans')}>
        Back to Plans
      </button>
      <button onClick={() => navigate('/home')} style={{ marginLeft: '10px' }}>
        Go to Home
      </button>
    </div>
  );
}