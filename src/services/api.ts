import axios from "axios";

const api = axios.create({
    baseURL: "/api",
    headers: {
        //"Content-Type": "application/json"
    }
});

// Автоматическая подстановка токена (если есть)
api.interceptors.request.use(config => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));

export default api;


export const registerUser = async (userData: any, avatarFile?: File) => {
    const formData = new FormData();
    formData.append("user", JSON.stringify(userData));
    formData.append("avatar", avatarFile);

    try {
        const response = await api.post("/authorization/register", formData);
        return response.data; // Возвращает токены
    } catch (error) {
        console.error("Registration failed:", error.response?.data || error);
        throw error;
    }
};

export const loginUser = async (identifier: string, password: string) => {
    try {
        // Создаем объект с нужными параметрами
        const loginData = {identifier, password};
        const response = await api.post("/authorization/login", loginData);
        return response.data; // Возвращает токен или другие данные
    } catch (error) {
        console.error("Login failed:", error.response?.data || error);
        throw error;
    }
};
