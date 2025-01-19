import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL, // Points to the backend
    headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
});

export default axiosInstance;
