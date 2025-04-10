<!-- src/components/CreateProjectDialog.vue -->
<template>
    <Dialog v-model:visible="visible" :style="{ width: '25rem', height: 'auto' }" position="right" :modal="true" :draggable="false" class="create-project-dialog">
        <template #header>
            <h2 class="dialog-header">New Project</h2>
        </template>

        <div class="dialog-content">
            <div class="input-group">
                <span class="input-label">Project Name</span>
                <InputText v-model="projectName" class="input-field" placeholder="Enter project name" />
            </div>

            <div class="input-group">
                <span class="input-label">Project Goal</span>
                <Textarea v-model="projectDescription" class="input-field input-goal" placeholder="Enter project goal" />
            </div>

            <Button label="Create a project" class="create-button" @click="createProject" />
        </div>

        <Toast />
    </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Toast from 'primevue/toast';
import { createProject as createProjectApi } from '../services/api'; // Импортируем с алиасом createProjectApi

// Пропсы
const props = defineProps({
    show: { type: Boolean, default: false },
});

// Эмиты
const emit = defineEmits(['update:show', 'create']);

// Данные
const visible = ref(props.show);
const projectName = ref('');
const projectDescription = ref(''); // Заменил projectGoal на projectDescription для соответствия API

// Инициализация Toast
const toast = useToast();

// Синхронизация видимости
watch(() => props.show, (newVal) => {
    visible.value = newVal;
    if (!newVal) {
        projectName.value = '';
        projectDescription.value = '';
    }
});
watch(visible, (newVal) => {
    emit('update:show', newVal);
});

// Создание проекта
const createProject = async () => {
    if (!projectName.value) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Project name is required', life: 3000 });
        return;
    }

    try {
        const projectData = {
            name: projectName.value,
            description: projectDescription.value || undefined, // Отправляем undefined, если description пустое
        };
        const response = await createProjectApi(projectData); // Используем переименованную функцию
        toast.add({ severity: 'success', summary: 'Success', detail: 'Project created successfully', life: 3000 });
        emit('create', response); // Передаём ProjectMemberDTO в родительский компонент
        console.log(projectName.value + ", " + projectDescription.value);
        visible.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create project', life: 3000 });
    }
};
</script>

<style scoped>
.create-project-dialog {
    background: #f0f0f0;
    border-radius: 10px;
}

.dialog-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
}

.input-group {
    width: 100%;
    margin-bottom: 15px;
}

.input-label {
    display: block;
    font-size: 14px;
    font-weight: bold;
    color: #1D5C57;
    margin-bottom: 5px;
    text-align: center;
}

.input-field {
    width: 100%;
    font-size: 16px;
    text-align: center;
}

.input-goal {
    height: 200px;
    resize: none;
}

:deep(.input-goal:placeholder-shown) {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

:deep(.input-goal:not(:placeholder-shown)) {
    text-align: center;
    vertical-align: top;
    padding-top: 10px;
}

.create-button {
    width: 300px;
    margin-top: 20px;
    background: #1F9D9B;
    border: none;
    border-radius: 20px;
    padding: 10px 20px;
    color: white;
    font-size: 16px;
}

.create-button:hover {
    background: #24b4ac;
}

.dialog-header {
    width: 100%;
    text-align: center;
    margin-left: 45px;
    font-size: 20px;
    font-weight: bold;
    color: #1F9D9B;
}
</style>