import axios from 'axios';

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    'https://xuvfgfgsm5.execute-api.us-east-2.amazonaws.com/dev';

export const roleHierarchy = {
    guest: 0,
    user: 1,
    admin: 2,
};

export async function getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    if (token === 'demo-token') {
        return { username: 'Demo User', role: 'guest' }; // special case for demo user
    }

    try {
        const res = await axios.get(`${API_BASE_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return res.data.user;
    } catch {
        return null;
    }
}

export const login = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userData', JSON.stringify(user));
};
