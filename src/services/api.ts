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

export const getUserData = async () => {
    try {
        // Получаем токен из localStorage
        const token = localStorage.getItem("access_token");
        console.log("Token:", token); // Проверьте, какой токен передается в запрос

        // Если токен есть, добавляем его в заголовок Authorization
        const response = await api.get("/user", {
            headers: {
                Authorization: `Bearer ${token}` // Добавляем токен в заголовок
            }
        });

        return response.data;
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        throw error; // Пробрасываем ошибку дальше
    }
};

// Новая функция для получения аватара
export const getUserAvatar = async () => {
    try {
        const response = await api.get("/user/avatar", { responseType: 'blob' });
        return URL.createObjectURL(response.data); // Конвертируем blob в URL
    } catch (error) {
        console.error("Failed to fetch user avatar:", error.response?.data || error);
        throw error;
    }
};

// Новая функция для обновления профиля пользователя
export const updateUserProfile = async (profileData: Partial<{
    name: string;
    surname: string;
    username: string;
    email: string;
    description: string,
    language_code: string;
}>) => {
    try {
        const response = await api.post("/user", profileData, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        return response.data; // Ожидаем 204 (No Content), поэтому данные могут быть пустыми
    } catch (error) {
        console.error("Failed to update user profile:", error.response?.data || error);
        throw error;
    }
};

export const createProject = async (projectData: {
    name: string;
    description: string;
}) => {
    try {
        const response = await api.post("/project/create", projectData, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        return response.data; // Возвращает ProjectMemberDTO
    } catch (error) {
        console.error("Failed to create project:", error.response?.data || error);
        throw error;
    }
};

// Новая функция для получения всех проектов пользователя
export const getAllUserProjects = async () => {
    try {
        const response = await api.get("/project/list");
        return response.data; // Возвращает массив ProjectMemberDTO
    } catch (error) {
        console.error("Failed to fetch projects:", error.response?.data || error);
        throw error;
    }
};

// Новая функция для получения деталей проекта
export const getProjectDetails = async (projectId: number) => {
    try {
        const response = await api.get(`/project/${projectId}`);
        return response.data; // ProjectMemberDTO
    } catch (error) {
        console.error(`Failed to fetch project ${projectId}:`, error.response?.data || error);
        throw error;
    }
};

// Новая функция для создания кода приглашения
export const createInvitationCode = async (projectId: number) => {
    try {
        const response = await api.post(`/project/${projectId}/code/create`);
        return response.data; // { code: string, created_at: string, expires_at: string }
    } catch (error) {
        console.error(`Failed to create invitation code for project ${projectId}:`, error.response?.data || error);
        throw error;
    }
};

// Новая функция для подключения к проекту по коду
export const connectToProject = async (code: string) => {
    try {
        const response = await api.post(`/project/connect/${code}`);
        return response.data; // ProjectMemberDTO
    } catch (error) {
        console.error(`Failed to connect to project with code ${code}:`, error.response?.data || error);
        throw error;
    }
};

export const setSystemRole = async (memberId: number, role: 'MEMBER' | 'ADMIN') => {
    try {
        const response = await api.patch(`/project/member/${memberId}/system-role`, { payload: role });
        console.log(`Set system role for member ${memberId}:`, {
            status: response.status,
            data: response.data
        });
        return response.data;
    } catch (error: any) {
        console.error(`Failed to set system role for member ${memberId}:`, {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            error: error
        });
        throw error;
    }
};

export const setDescriptiveRole = async (memberId: number, role: string) => {
    try {
        const response = await api.post(`/project/member/${memberId}/descriptive-role`, { payload: role });
        console.log(`Set descriptive role for member ${memberId}:`, {
            status: response.status,
            data: response.data
        });
        return response.data;
    } catch (error: any) {
        console.error(`Failed to set descriptive role for member ${memberId}:`, {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            error: error
        });
        throw error;
    }
};