import { useEffect } from 'react';
import { checkTokenExpiry } from '../utils/jwtUtils';

export default function TokenExpiryGuard() {
  useEffect(() => {
    checkTokenExpiry(); // run on mount
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000); // every 5 mins

    return () => clearInterval(interval);
  }, []);

  return null;
}