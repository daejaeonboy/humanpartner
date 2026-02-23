import axios from 'axios';

// Create an Axios instance with default configuration
const client = axios.create({
    baseURL: 'http://localhost:4000/api', // Pointing to our Express backend
    headers: {
        'Content-Type': 'application/json',
    },
});

export default client;
