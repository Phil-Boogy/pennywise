import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // sends httpOnly cookies automatically
});

export const registerUser = async (email: string, password: string) => {
    const response = await api.post("/api/auth/register", { email, password });
    return response.data;
};

export const loginUser = async (email: string, password: string) => {
    const response = await api.post("/api/auth/login", { email, password });
    return response.data;
};

export const refreshToken = async () => {
    const response = await api.post("/api/auth/refresh");
    return response.data;
};

export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common["Authorization"];
    }
};

export const logoutUser = async () => {
    const response = await api.post("/api/auth/logout");
    return response.data;
};