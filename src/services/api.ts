import axios from "axios";

const api = axios.create({
    baseURL: "/api",
    headers: {
        //"Content-Type": "application/json"
    }
});

// Автоматическая подстановка токена
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
        return response.data;
    } catch (error) {
        console.error("Registration failed:", error.response?.data || error);
        throw error;
    }
};

export const loginUser = async (identifier: string, password: string) => {
    try {
        const loginData = { identifier, password };
        const response = await api.post("/authorization/login", loginData);
        return response.data;
    } catch (error) {
        console.error("Login failed:", error.response?.data || error);
        throw error;
    }
};

export const updateUserPassword = async (oldPassword, newPassword) => {
    try {
        await api.patch('/user/password', {
            old_password: oldPassword,
            new_password: newPassword
        });
    } catch (error) {
        console.error('Failed to update password:', error.response?.data || error);
        throw error;
    }
};

export const getUserData = async () => {
    try {
        const token = localStorage.getItem("access_token");
        console.log("Token:", token);
        const response = await api.get("/user", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        throw error;
    }
};

export const getUserAvatar = async () => {
    try {
        const response = await api.get("/user/avatar", {
            responseType: 'blob'
        });
        return URL.createObjectURL(response.data);
    } catch (error) {
        console.error("Failed to fetch user avatar:", error.response?.data || error);
        throw error;
    }
};

export const uploadUserAvatar = async (avatarFile: File) => {
    try {
        const formData = new FormData();
        formData.append("file", avatarFile);
        await api.post("/user/avatar", formData);
    } catch (error) {
        console.error("Failed to upload user avatar:", error.response?.data || error);
        throw error;
    }
};

export const getMemberAvatar = async (memberId: number) => {
    try {
        const response = await api.get(`/project/member/${memberId}/avatar`, {
            responseType: 'blob'
        });
        return URL.createObjectURL(response.data);
    } catch (error) {
        console.error(`Failed to fetch member ${memberId} avatar:`, error.response?.data || error);
        throw error;
    }
};

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
        return response.data;
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
        return response.data;
    } catch (error) {
        console.error("Failed to create project:", error.response?.data || error);
        throw error;
    }
};

export const deleteProject = async (projectId: number) => {
    console.log(`deleteProject - Attempting to delete projectId: ${projectId}`);
    try {
        await api.delete(`/project/delete/${projectId}`);
        console.log(`deleteProject - Project ${projectId} deleted successfully`);
    } catch (error: any) {
        console.error(`deleteProject - Failed to delete project ${projectId}:`, {
            status: error.response?.status,
            data: error.response?.data,
            message: error.response?.data?.message || error.message || 'Unknown error',
            url: `/api/project/delete/${projectId}`,
        });
        const apiError: { message: string; status: number } = {
            message: error.response?.data?.message || 'Failed to delete project',
            status: error.response?.status || 500,
        };
        throw apiError;
    }
};

export const getAllUserProjects = async () => {
    try {
        const response = await api.get("/project/list");
        return response.data;
    } catch (error) {
        console.error("Failed to fetch projects:", error.response?.data || error);
        throw error;
    }
};

export const getProjectDetails = async (projectId: number) => {
    try {
        const response = await api.get(`/project/${projectId}`);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch project ${projectId}:`, error.response?.data || error);
        throw error;
    }
};

export const createInvitationCode = async (projectId: number) => {
    try {
        const response = await api.post(`/project/${projectId}/code/create`);
        return response.data;
    } catch (error) {
        console.error(`Failed to create invitation code for project ${projectId}:`, error.response?.data || error);
        throw error;
    }
};

export const connectToProject = async (code: string) => {
    try {
        const response = await api.post(`/project/connect/${code}`);
        return response.data;
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

export const deleteMember = async (memberId: number) => {
    try {
        const response = await api.delete(`/project/member/${memberId}/delete`);
        console.log(`Deleted member ${memberId}:`, {
            status: response.status,
            data: response.data
        });
        return response.data;
    } catch (error: any) {
        console.error(`Failed to delete member ${memberId}:`, {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            error: error
        });
        throw error;
    }
};

export interface Task {
    name: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    start_at: string | null;
    end_at: string | null;
    implementer_member_ids: number[];
}

export interface CreateSprintRequest {
    name: string;
    description: string;
    tasks: Task[];
    start_at: string | null;
    end_at: string | null;
}

export interface SprintDTO {
    id: number;
    name: string;
    description: string;
    tasks: Task[];
    start_at: string | null;
    end_at: string | null;
}

export interface ShortSprintDTO {
    id: number;
    name: string;
    description: string;
    tasks: number;
    start_time: string;
    end_time: string;
    is_ended: boolean;
    is_started: boolean;
}

export interface ApiError {
    message: string;
    status: number;
}

export const createSprint = async (projectId: number, sprintData: CreateSprintRequest): Promise<SprintDTO> => {
    console.log(`createSprint - Sending request for projectId: ${projectId}, data:`, JSON.stringify(sprintData, null, 2));
    try {
        const response = await api.post<SprintDTO>(`/project/${projectId}/sprint`, sprintData);
        console.log(`createSprint - Sprint created successfully:`, JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error: any) {
        const response = error.response || {};
        console.error(`createSprint - Failed to create sprint:`, {
            status: response.status,
            data: response.data ? JSON.stringify(response.data, null, 2) : 'No data',
            message: response.data?.message || error.message || 'Unknown error',
            url: `/api/project/${projectId}/sprint`,
        });
        const apiError: ApiError = {
            message: response.data?.message || 'Failed to create sprint',
            status: response.status || 500,
        };
        throw apiError;
    }
};

export const getProjectSprints = async (projectId: number): Promise<ShortSprintDTO[]> => {
    console.log(`getProjectSprints - Fetching sprints for projectId: ${projectId}`);
    try {
        const response = await api.get<ShortSprintDTO[]>(`/project/${projectId}/sprints`);
        console.log(`getProjectSprints - Sprints fetched successfully for projectId: ${projectId}:`, JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error: any) {
        const response = error.response || {};
        console.error(`getProjectSprints - Failed to fetch sprints for projectId: ${projectId}:`, {
            status: response.status,
            data: response.data ? JSON.stringify(response.data, null, 2) : 'No data',
            message: response.data?.message || error.message || 'Unknown error',
            url: `/api/project/${projectId}/sprints`,
        });
        const apiError: ApiError = {
            message: response.data?.message || 'Failed to fetch sprints',
            status: response.status || 500,
        };
        throw apiError;
    }
};

export const getSprintDetails = async (projectId: number, sprintId: number): Promise<SprintDTO> => {
    console.log(`getSprintDetails - Fetching sprint details for projectId: ${projectId}, sprintId: ${sprintId}`);
    try {
        const response = await api.get<SprintDTO>(`/project/${projectId}/sprint/${sprintId}`);
        console.log(`getSprintDetails - Sprint details fetched successfully for sprintId: ${sprintId}:`, JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error: any) {
        const response = error.response || {};
        console.error(`getSprintDetails - Failed to fetch sprint details for sprintId: ${sprintId}:`, {
            status: response.status,
            data: response.data ? JSON.stringify(response.data, null, 2) : 'No data',
            message: response.data?.message || error.message || 'Unknown error',
            url: `/api/project/${projectId}/sprint/${sprintId}`,
        });
        const apiError: ApiError = {
            message: response.data?.message || 'Failed to fetch sprint details',
            status: response.status || 500,
        };
        throw apiError;
    }
};

export const deleteSprint = async (projectId: number, sprintId: number): Promise<void> => {
    console.log(`deleteSprint - Attempting to delete sprintId: ${sprintId} for projectId: ${projectId}`);
    try {
        await api.delete(`/project/${projectId}/sprint/${sprintId}`);
        console.log(`deleteSprint - Sprint ${sprintId} deleted successfully`);
    } catch (error: any) {
        const response = error.response || {};
        console.error(`deleteSprint - Failed to delete sprint ${sprintId}:`, {
            status: response.status,
            data: response.data ? JSON.stringify(response.data, null, 2) : 'No data',
            message: response.data?.message || error.message || 'Unknown error',
            url: `/api/project/${projectId}/sprint/${sprintId}`,
        });
        const apiError: ApiError = {
            message: response.data?.message || 'Failed to delete sprint',
            status: response.status || 500,
        };
        throw apiError;
    }
};

// Изменение статуса задачи
export const changeTaskStatus = async (projectId: number, sprintId: number, taskId: number, status: 'TODO' | 'IN_PROGRESS' | 'DONE'): Promise<void> => {
    console.log(`changeTaskStatus - Sending request to change status for projectId: ${projectId}, sprintId: ${sprintId}, taskId: ${taskId}, status: ${status}`);
    try {
        await api.patch(`/project/${projectId}/sprint/${sprintId}/${taskId}`, status, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log(`changeTaskStatus - Task status changed successfully for taskId: ${taskId}`);
    } catch (error: any) {
        const response = error.response || {};
        console.error(`changeTaskStatus - Failed to change task status for taskId: ${taskId}:`, {
            status: response.status,
            data: response.data ? JSON.stringify(response.data, null, 2) : 'No data',
            message: response.data?.message || error.message || 'Unknown error',
            url: `/api/project/${projectId}/sprint/${sprintId}/${taskId}`,
        });
        const apiError: ApiError = {
            message: response.data?.message || 'Failed to change task status',
            status: response.status || 500,
        };
        throw apiError;
    }
};