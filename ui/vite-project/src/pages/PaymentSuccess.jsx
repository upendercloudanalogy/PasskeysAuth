// PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const token = searchParams.get('token');

  useEffect(() => {
    const capturePayment = async () => {
      try {
        const response = await fetch('http://localhost:3000/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: token })
        });
        
        const result = await response.json();
        setStatus(result.success ? 'success' : 'failed');
      } catch (error) {
        setStatus('failed');
      }
    };

    if (token) {
      capturePayment();
    }
  }, [token]);

  return (
    <div>
      {status === 'processing' && <h2>Processing payment...</h2>}
      {status === 'success' && <h2>Payment successful! Thank you.</h2>}
      {status === 'failed' && <h2>Payment failed. Please try again.</h2>}
    </div>
  );
}