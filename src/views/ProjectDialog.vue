<!-- src/components/ProjectDialog.vue -->
<template>
    <Dialog v-model:visible="visible" :style="{ width: '50vw' }" :modal="true" :draggable="false" :show-header="false"
        class="project-dialog">
        <div v-if="loading" class="loading">Loading...</div>
        <div v-else-if="error" class="error">Failed to load project details</div>
        <div v-else class="dialog-content">
            <!-- Часть 1: Информация о проекте (2/3) -->
            <div class="project-info">
                <Button icon="pi pi-times" class="close-button" @click="visible = false" />
                <h2 class="project-title">{{ projectData.name || 'Project name' }}</h2>
                <Button v-if="isOwner" icon="pi pi-pencil" class="edit-button" @click="startEditingDescription" />
                <div class="creator-info">
                    <Avatar :image="avatarUrl"
                        :label="!avatarUrl ? (projectData.owner?.slice(0, 2).toUpperCase() || 'CR') : ''" size="xlarge"
                        shape="circle" />
                    <span class="creator-name">{{ projectData.ownerFullName || projectData.owner || 'Creator Name'
                        }}</span>
                </div>
                <div class="term-label">Term of work</div>
                <div class="term-date">TBD</div>
                <div class="goal-label">Project goal and description</div>
                <div v-if="!isEditingDescription" class="goal-text">
                    {{ projectData.description || 'Description will be added soon...' }}
                </div>
                <div v-else class="edit-description">
                    <InputText v-model="editedDescription" type="text" class="description-input"
                        placeholder="Enter project description" />
                    <div class="edit-buttons">
                        <Button label="Save" class="save-button" @click="saveDescription" />
                        <Button label="Cancel" class="cancel-button" @click="cancelEditingDescription" />
                    </div>
                </div>
                <div class="sprint-label">Current sprint</div>
                <div class="current-sprint">
                    <ProgressCircle :progress="50" />
                    <div class="sprint-details">
                        <div class="sprint-name">Sprint TBD</div>
                        <div class="sprint-deadline">TBD</div>
                    </div>
                </div>
                <div class="completed-label">Completed sprints</div>
                <div class="completed-sprints">
                    <div class="sprint-plaque">
                        <ProgressCircle :progress="100" />
                        <div class="sprint-details">
                            <div class="sprint-name">Sprint 1</div>
                            <div class="sprint-deadline">Completed</div>
                        </div>
                    </div>
                    <div class="sprint-plaque">
                        <ProgressCircle :progress="100" />
                        <div class="sprint-details">
                            <div class="sprint-name">Sprint 2</div>
                            <div class="sprint-deadline">Completed</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Часть 2: Динамическое содержимое (1/3) -->
            <div class="users-info">
                <UsersInfo v-if="viewMode === 'users'" 
                :project-data="projectData" 
                :project-id="props.projectId"
                @show-sprint-form="viewMode = 'sprint'" />
                <SprintForm v-else-if="viewMode === 'sprint'" 
                :project-data="projectData"
                @close-form="viewMode = 'users'" />
            </div>
        </div>
    </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import InputText from 'primevue/inputtext';
import ProgressCircle from './ProgressCircle.vue';
import UsersInfo from './UsersInfo.vue';
import SprintForm from './SprintForm.vue';
import { getProjectDetails, getUserData, getUserAvatar } from '../services/api';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const props = defineProps({
    show: { type: Boolean, default: false },
    projectId: { type: Number, default: null },
});

const emit = defineEmits(['update:show']);

const visible = ref(props.show);
const projectData = ref({});
const loading = ref(false);
const error = ref(null);
const avatarUrl = ref(null);
const isOwner = ref(false);
const isEditingDescription = ref(false);
const editedDescription = ref('');
const viewMode = ref('users'); // 'users' или 'sprint'

const fetchProjectDetails = async () => {
    if (!props.projectId) return;
    loading.value = true;
    error.value = null;
    try {
        const details = await getProjectDetails(props.projectId);
        console.log('Fetched project details:', details);

        // Получаем данные текущего пользователя
        const userData = await getUserData();
        const currentUser = {
            username: userData.username || 'Unknown',
            name: userData.name || '',
            surname: userData.surname || '',
            email: userData.email || '',
            description: userData.description || '',
            language_code: userData.language_code || '',
            registered_at: userData.registered_at || new Date().toISOString(),
        };

        // Находим владельца
        let owner = details.others.find(member => member.system_role === 'OWNER')?.user.username;
        let ownerFullName = details.others.find(member => member.system_role === 'OWNER')?.user.name + ' ' +
            details.others.find(member => member.system_role === 'OWNER')?.user.surname;

        // Список участников (исключаем владельца)
        let others = details.others.filter(member => member.system_role !== 'OWNER') || [];

        // Если текущий пользователь - участник (MEMBER), добавляем его в список
        isOwner.value = details.system_role === 'OWNER';
        if (details.system_role === 'MEMBER') {
            const isCurrentUserInOthers = others.some(member => member.user.username === currentUser.username);
            if (!isCurrentUserInOthers) {
                others.push({
                    member_id: `current-${currentUser.username}`, // Уникальный ID для текущего пользователя
                    system_role: 'MEMBER',
                    descriptive_role: details.descriptive_role || 'Member',
                    user: currentUser,
                });
            }
        }

        // Если текущий пользователь - владелец, но не в others
        if (isOwner.value && !owner) {
            owner = currentUser.username;
            ownerFullName = `${currentUser.name || ''} ${currentUser.surname || ''}`.trim() || owner;
            try {
                avatarUrl.value = await getUserAvatar();
            } catch (err) {
                console.warn('No avatar available:', err);
                avatarUrl.value = null;
            }
        }

        projectData.value = {
            name: details.project.name,
            owner: owner || 'Unknown',
            ownerFullName: ownerFullName || 'Unknown',
            description: details.project.description || '',
            others,
        };
    } catch (err) {
        error.value = err;
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load project details', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const startEditingDescription = () => {
    editedDescription.value = projectData.value.description || '';
    isEditingDescription.value = true;
};

const saveDescription = () => {
    projectData.value.description = editedDescription.value;
    isEditingDescription.value = false;
    toast.add({ severity: 'success', summary: 'Success', detail: 'Description saved locally (pending backend update)', life: 3000 });
};

const cancelEditingDescription = () => {
    isEditingDescription.value = false;
    editedDescription.value = '';
};

watch(() => props.show, (newVal) => {
    visible.value = newVal;
    if (newVal && props.projectId) {
        fetchProjectDetails();
    }
});

watch(visible, (newVal) => {
    emit('update:show', newVal);
    if (!newVal) {
        viewMode.value = 'users'; // Сбрасываем на список пользователей при закрытии
    }
});
</script>

<style scoped>
.project-dialog {
    background: #f0f0f0;
    border-radius: 10px;
    padding: 0;
}

/* Переопределяем PrimeVue */
:deep(.p-dialog-content) {
    padding: 0 !important;
    /* Убираем весь padding с приоритетом */
    background: #f0f0f0;
    border-radius: 10px;
    overflow: hidden;
}

.dialog-content {
    display: flex;
    height: 80vh;
    overflow: hidden;
    background: #f0f0f0;
    border-radius: 10px;
}

.project-info {
    flex: 2;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    overflow-y: auto;
    position: relative;
    background: #f0f0f0;
}

.users-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    background: #f0f0f0;
    border-top-right-radius: 10px;
    /* Закругление правого верхнего угла */
    border-bottom-right-radius: 10px;
    /* Закругление правого нижнего угла */
    box-sizing: border-box;
}

.project-title {
    text-align: center;
    margin: 0;
    color: #1F9D9B;
    font-size: 24px;
    line-height: 30px;
}

.close-button {
    position: absolute;
    top: 10px;
    left: 10px;
    background: transparent;
    border: none;
    color: #1F9D9B;
    font-size: 18px;
}

.edit-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: transparent;
    border: none;
    color: #1F9D9B;
    font-size: 18px;
}

.creator-info {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: flex-start;
}

.creator-name {
    font-size: 18px;
    color: #1D5C57;
}

.term-label,
.goal-label {
    font-size: 16px;
    font-weight: bold;
    color: #1D5C57;
    text-align: left;
}

.sprint-label,
.completed-label {
    font-size: 16px;
    font-weight: bold;
    color: #1D5C57;
    text-align: center;
}

.term-date {
    font-size: 14px;
    color: #666;
    text-align: left;
}

.goal-text {
    font-size: 14px;
    color: #333;
    text-align: justify;
}

.edit-description {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.description-input {
    width: 100%;
    font-size: 14px;
    padding: 8px;
}

.edit-buttons {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.save-button {
    background: #1F9D9B;
    border: none;
    color: white;
}

.save-button:hover {
    background: #1D5C57;
}

.cancel-button {
    background: #666;
    border: none;
    color: white;
}

.cancel-button:hover {
    background: #555;
}

.current-sprint,
.sprint-plaque {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: #1F9D9B;
    padding: 10px;
    border-radius: 8px;
    color: white;
    width: 80%;
    margin: 0 auto;
}

.sprint-details {
    display: flex;
    flex-direction: column;
}

.sprint-name,
.sprint-deadline {
    font-size: 12px;
}

.completed-sprints {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
}

.loading,
.error {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80vh;
    font-size: 18px;
    color: #1D5C57;
}
</style>