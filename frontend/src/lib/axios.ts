import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Pointing to our Express backend
  withCredentials: true, // CRITICAL: This tells the browser to send our JWT cookies!
});

export default api;
