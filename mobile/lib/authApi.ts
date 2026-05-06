import Constants from 'expo-constants';

// For development, we often need to use the local IP address of the machine running the Next.js server
// On a real production app, this would be your production URL (e.g., https://bookmyticket.net)
const API_URL = 'https://bookmyticket.net'; // Change this as needed

export async function sendOtp(identifier: { email?: string; phone?: string }) {
  try {
    const response = await fetch(`${API_URL}/api/auth/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...identifier, action: 'send', purpose: 'signin' }),
    });
    return await response.json();
  } catch (error) {
    console.error('sendOtp error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function verifyOtp(params: { email?: string; phone?: string; code: string }) {
  try {
    const response = await fetch(`${API_URL}/api/auth/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, action: 'verify', purpose: 'signin' }),
    });
    return await response.json();
  } catch (error) {
    console.error('verifyOtp error:', error);
    return { success: false, error: 'Network error' };
  }
}
