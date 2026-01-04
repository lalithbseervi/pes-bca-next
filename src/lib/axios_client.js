import axios from 'axios';

/**
 * Axios instance with automatic 401 handling
 * Intercepts all 401 responses and clears auth data
 */
const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true, // Include cookies in requests
  timeout: 30000, // 30 second timeout
});

/**
 * Response interceptor for centralized 401 error handling
 */
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      handleUnauthorized();
      return Promise.reject(new Error('Unauthorized - Please re-authenticate'));
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

/**
 * Clear all authentication data and redirect to login
 */
function handleUnauthorized() {
  // Clear authentication tokens from cookies
  clearAuthTokens();

  // Clear user session from localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('user_session');
    } catch (error) {
      console.warn('Failed to clear user_session from localStorage:', error);
    }
  }

  // Redirect to authentication page
  if (typeof window !== 'undefined') {
    window.location.href = '/authenticate';
  }
}

/**
 * Clear authentication cookies by setting them to empty values with past expiry
 */
function clearAuthTokens() {
  if (typeof document === 'undefined') return;

  const pastDate = new Date(0).toUTCString();
  const cookieOptions = `; path=/; expires=${pastDate}; secure; samesite=strict`;

  document.cookie = `access_token=` + cookieOptions;
  document.cookie = `refresh_token=` + cookieOptions;
}

export default axiosClient;
