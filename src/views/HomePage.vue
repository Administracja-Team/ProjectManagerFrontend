<script setup>
import { ref, onMounted, computed } from 'vue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import { getUserData, getAllUserProjects } from '../services/api';
import InputText from 'primevue/inputtext';
import ProgressCircle from './ProgressCircle.vue';
import ProfileDialog from './ProfileDialog.vue';
import CreateProjectDialog from './CreateProjectDialog.vue';
import ProjectDialog from './ProjectDialog.vue'; // Новый импорт
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();

const userData = ref({
    name: '',
    surname: '',
    username: '',
    email: '',
    avatar: '',
    about: '',
});

const dialogVisible = ref(false);
const createDialogVisible = ref(false);
const projectDialogVisible = ref(false); // Для диалога проекта
const selectedProject = ref(null); // Выбранный проект

const projects = ref([]);

const gridContainer = ref(null);

const fetchUserData = async () => {
    try {
        const data = await getUserData();
        console.log('Fetched user data:', data);
        userData.value = {
            name: data.name || '',
            surname: data.surname || '',
            username: data.username || '',
            email: data.email || '',
            avatar: data.avatar || 'IH',
            about: data.description || '',
        };
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
};

const fetchProjects = async () => {
    try {
        const projectData = await getAllUserProjects();
        console.log('Fetched projects:', projectData);
        projects.value = projectData.map(project => ({
            projectId: project.project.id,
            name: project.project.name,
            owner: project.owner_name || 'Unknown',
            sprint: 'Sprint TBD',
            deadline: 'TBD',
            progress: 0
        }));
    } catch (error) {
        console.error('Error in fetchProjects:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load projects', life: 3000 });
    }
};

onMounted(() => {
    fetchUserData();
    fetchProjects();
});

const projectSlides = computed(() => {
    const slides = [];
    for (let i = 0; i < projects.value.length; i += 10) {
        slides.push(projects.value.slice(i, i + 10));
    }
    return slides;
});

const scrollLeft = () => {
    if (gridContainer.value) {
        gridContainer.value.scrollBy({ left: -480, behavior: 'smooth' });
    }
};

const scrollRight = () => {
    if (gridContainer.value) {
        gridContainer.value.scrollBy({ left: 480, behavior: 'smooth' });
    }
};

const showArrows = () => projects.value.length > 10;

const openProjectDialog = (project) => {
    selectedProject.value = project;
    projectDialogVisible.value = true;
};

const gotoProfile = () => {
    dialogVisible.value = true;
};

const handleSave = (data) => {
    userData.value.name = data.name || userData.value.name;
    userData.value.surname = data.surname || userData.value.surname;
    userData.value.username = data.username || userData.username;
    userData.value.email = data.email || userData.value.email;
    userData.value.avatar = data.avatar || userData.value.avatar;
    console.log('Profile updated:', userData.value);
};

const login_out = () => {
    localStorage.clear();
    router.push('/');
};

const showCreateProjectDialog = () => {
    createDialogVisible.value = true;
};

const handleCreateProject = (projectData) => {
    console.log('New project created:', projectData);
    fetchProjects();
};
</script>

<template>
    <div class="layout">
        <div class="topbar">
            <div class="profile">
                <h2>Project Manager</h2>
                <Button class="name-button" @click="gotoProfile">
                    {{ userData.name }} {{ userData.surname }}
                </Button>
                <Button label="Projects" class="dashboard-button" />
            </div>
            <div class="icons">
                <i class="pi pi-globe"></i>
                <i class="pi pi-moon"></i>
                <Button icon="pi pi-sign-out" class="out-button" size="large" rounded aria-label="login-out" @click="login_out" />
            </div>
        </div>

        <div class="workspace">
            <div class="empty-space"></div>

            <div class="projects-container">
                <div class="header">
                    <Button v-if="showArrows()" icon="pi pi-chevron-left" class="scroll-button left" @click="scrollLeft" />
                    <h2>Current Sprints</h2>
                    <Button v-if="showArrows()" icon="pi pi-chevron-right" class="scroll-button right" @click="scrollRight" />
                </div>
                <div class="slider-wrapper">
                    <div ref="gridContainer" class="grid-container">
                        <div v-for="(slide, slideIndex) in projectSlides" :key="slideIndex" class="slide">
                            <button v-for="project in slide" :key="project.projectId" class="grid-item" @click="openProjectDialog(project)">
                                <div class="progress-circle">
                                    <ProgressCircle :progress="project.progress" />
                                </div>
                                <div class="text-container">
                                    <div class="project-name">{{ project.name }}</div>
                                    <div class="project-owner">{{ project.owner }}</div>
                                    <div class="sprint-name">{{ project.sprint }}</div>
                                    <div class="sprint-deadline">{{ project.deadline }}</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="action-panel">
                <Button label="Create a project" class="action-button create" @click="showCreateProjectDialog" />
                <div class="connect-box">
                    <h3>Connect to project</h3>
                    <div class="input-container">
                        <div class="input-space"></div>
                        <div class="input-wrapper">
                            <InputText class="project-input" placeholder="Put ID of a project" />
                        </div>
                        <div class="button-wrapper">
                            <Button icon="pi pi-arrow-right" class="input-button" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <ProfileDialog 
            :show="dialogVisible" 
            position="left" 
            :initial-name="userData.name" 
            :initial-surname="userData.surname"
            :initial-username="userData.username" 
            :initial-email="userData.email" 
            :initial-avatar="userData.avatar" 
            @update:show="dialogVisible = $event" 
            @save="handleSave" 
        />

        <CreateProjectDialog 
            :show="createDialogVisible" 
            @update:show="createDialogVisible = $event" 
            @create="handleCreateProject" 
        />

        <ProjectDialog 
            :show="projectDialogVisible" 
            :project="selectedProject" 
            @update:show="projectDialogVisible = $event" 
        />

        <Toast />
    </div>
</template>

<style scoped>
html, body, .layout {
    height: 100vh;
    margin: 0;
    padding: 0;
}

.layout {
    display: flex;
    flex-direction: column;
    font-family: Arial, sans-serif;
}

/* Верхняя панель */
.topbar {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    background: #1D5C57;
    color: white;
    padding: 0 20px;
    height: 60px;
}

.profile {
    display: flex;
    align-items: center;
}

.name-button {
    height: inherit;
    background: #1D5C57;
    border: none;
    color: white;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0;
    align-self: stretch;
    margin-left: 20px;
}

.dashboard-button {
    width: 100px;
    height: inherit;
    background: #1F9D9B;
    border: none;
    color: white;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0;
    align-self: stretch;
}

.dashboard-button:hover, .name-button:hover {
    background: #24b4ac;
}

.icons i {
    font-size: 18px;
    margin-left: 15px;
    margin-right: 15px;
    margin-top: 20px;
    cursor: pointer;
}

.out-button {
    background-color: #1D5C57;
    border: none;
}

.out-button:hover {
    border: none !important;
}

/* Контейнер рабочей области */
.workspace {
    display: flex;
    height: calc(100vh - 60px);
}

.empty-space {
    flex: 1;
}

/* Светло-серый прямоугольник */
.projects-container {
    flex: 2;
    display: flex;
    flex-direction: column;
    background: #f0f0f0;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
}

/* Заголовок с кнопками */
.header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
}

.header h2 {
    margin: 0;
}

/* Обёртка для слайдера */
.slider-wrapper {
    flex: 1;
    overflow: hidden;
}

/* Контейнер для грида */
.grid-container {
    display: flex;
    flex-wrap: nowrap;
    gap: 10px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    height: 100%; /* 5 строк по 100px + 4 промежутка по 10px */
    width: 100%;
    padding-bottom: 10px;
}

.grid-container::-webkit-scrollbar {
    height: 8px;
}

.grid-container::-webkit-scrollbar-thumb {
    background: #1F9D9B;
    border-radius: 4px;
}

.grid-container::-webkit-scrollbar-track {
    background: #ddd;
}

/* Слайд (сетка 2x5) */
.slide {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(5, 100px);
    gap: 10px;
    flex-shrink: 0;
    width: 100%; /* Ширина слайда равна контейнеру */
    height: 100%;
}

/* Кнопка внутри грида */
.grid-item {
    display: flex;
    align-items: center;
    background: #1F9D9B;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    color: white;
    font-weight: bold;
    border: none;
    cursor: pointer;
    transition: background 0.3s;
    height: 100px;
    scroll-snap-align: start;
}

.grid-item:hover {
    background: #198d87;
}

/* Контейнер для текста справа от прогресс-бара */
.text-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 5px;
    flex: 1;
    align-items: center;
}

/* Название проекта */
.project-name {
    font-size: 14px;
    font-weight: bold;
    grid-column: 1;
    grid-row: 1;
}

/* Владелец проекта */
.project-owner {
    font-size: 14px;
    font-weight: bold;
    grid-column: 2;
    grid-row: 1;
}

/* Название спринта */
.sprint-name {
    font-size: 12px;
    color: #ddd;
    margin-top: 10px;
    grid-column: 1;
    grid-row: 2;
}

/* Дедлайн */
.sprint-deadline {
    font-size: 12px;
    color: #ddd;
    margin-top: 10px;
    grid-column: 2;
    grid-row: 2;
}

/* Кнопки прокрутки */
.scroll-button {
    width: 30px;
    height: 30px;
    background: #1F9D9B;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.3s;
}

.scroll-button:hover {
    background: #24b4ac;
}

.scroll-button.left {
    margin-right: 10px;
}

.scroll-button.right {
    margin-left: 10px;
}

/* Панель с кнопками (справа) */
.action-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 5px;
}

/* Общие стили кнопок */
.action-button {
    width: 100%;
    height: 50px;
    font-size: 16px;
    border-radius: 20px;
    margin-top: 60px;
}

/* Кнопка "Создать проект" */
.create {
    color: white;
}

.connect-box {
    width: 100%;
    background: #1F9D9B;
    padding: 15px;
    border-radius: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    margin-top: 5px;
}

.connect-box h3 {
    margin: 0 0 10px 0;
    text-align: center;
    color: white;
}

.input-container {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 10px;
}

.input-space {
    flex: 1;
}

.input-wrapper {
    flex: 3;
    display: flex;
    justify-content: center;
}

.project-input {
    width: 100%;
    max-width: 300px;
    background: white !important;
    border: none !important;
    padding: 8px;
    font-size: 14px;
    outline: none;
    box-shadow: none !important;
    height: 50px;
    text-align: center;
    border-radius: 50px;
}

.button-wrapper {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.input-button {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background-color: white;
    color: #1F9D9B;
}
</style>