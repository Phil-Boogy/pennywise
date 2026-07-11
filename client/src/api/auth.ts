import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common["Authorization"];
    }
};

export const refreshToken = async () => {
    const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
        {
            method: "POST",
            credentials: "include",
        }
    );
    if (!response.ok) {
        throw new Error("Refresh failed");
    }
    return response.json();
};

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers["Authorization"] = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await refreshToken();
                const newToken = response.accessToken;
                setAuthToken(newToken);
                processQueue(null, newToken);
                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                setAuthToken(null);
                window.location.href = "/login";
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export const registerUser = async (email: string, password: string) => {
    const response = await api.post("/api/auth/register", { email, password });
    return response.data;
};

export const loginUser = async (email: string, password: string) => {
    const response = await api.post("/api/auth/login", { email, password });
    return response.data;
};

export const logoutUser = async () => {
    const response = await api.post("/api/auth/logout");
    return response.data;
};