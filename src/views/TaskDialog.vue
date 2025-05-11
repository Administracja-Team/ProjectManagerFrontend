<!-- src/components/TaskDialog.vue -->
<template>
    <Dialog 
        v-model:visible="visible" 
        :style="{ width: '28vw', height: '85vh' }" 
        :modal="true" 
        :draggable="false" 
        :show-header="false" 
        position="right" 
        class="task-dialog"
    >
        <div class="task-form-container">
            <Button 
                icon="pi pi-arrow-left" 
                class="task-close-button" 
                @click="closeForm" 
            />
            <h3 class="task-title">{{ mode === 'edit' ? 'Edit task' : 'New task' }}</h3>
            <div class="task-form">
                <div class="form-label">Name</div>
                <InputText 
                    v-model="taskName" 
                    class="form-input" 
                    placeholder="Task name" 
                />
                <div class="form-label">Description</div>
                <Textarea 
                    v-model="taskDescription" 
                    class="form-textarea" 
                    placeholder="Task description" 
                    :auto-resize="true" 
                    rows="4" 
                />
                <div class="form-label">Work period</div>
                <div class="date-pickers">
                    <Calendar 
                        v-model="taskStartDate" 
                        :show-icon="true" 
                        placeholder="Start date" 
                        date-format="dd/mm/yy" 
                    />
                    <Calendar 
                        v-model="taskEndDate" 
                        :show-icon="true" 
                        placeholder="End date" 
                        date-format="dd/mm/yy" 
                    />
                </div>
                <div class="form-label">Priority</div>
                <div class="priority-buttons">
                    <Button 
                        v-for="option in priorityOptions" 
                        :key="option.value" 
                        :label="option.label" 
                        :class="{ 
                            'priority-button': true,
                            'active': taskPriority === option.value,
                            'priority-low': option.value === 'Low',
                            'priority-medium': option.value === 'Medium',
                            'priority-high': option.value === 'High'
                        }" 
                        @click="setPriority(option.value)" 
                    />
                </div>
                <div class="form-label">Select a participant for this task</div>
                <div class="participant-selection">
                    <div class="selected-participants">
                        <div 
                            v-for="participant in selectedParticipants" 
                            :key="participant.username + '-' + participant.member_id" 
                            class="selected-participant-item"
                        >
                            <Avatar 
                                v-if="isLoadingAvatars"
                                :label="participant.username.slice(0, 2).toUpperCase()"
                                size="medium" 
                                shape="circle" 
                                class="loading-avatar"
                            />
                            <Avatar 
                                v-else
                                :image="avatarUrls[String(participant.member_id)] || null"
                                :label="!avatarUrls[String(participant.member_id)] ? participant.username.slice(0, 2).toUpperCase() : null"
                                size="medium" 
                                shape="circle" 
                                :key="avatarUrls[String(participant.member_id)] || participant.username"
                            />
                            <span class="selected-participant-name">{{ participant.name }}</span>
                            <Button 
                                icon="pi pi-times" 
                                class="remove-participant-button" 
                                @click="removeParticipant(participant)" 
                            />
                        </div>
                    </div>
                    <Button 
                        label="Select" 
                        class="select-participant-button" 
                        @click="toggleParticipantPanel" 
                    />
                </div>
                <Button 
                    :label="mode === 'edit' ? 'Update Task' : 'Create a task'" 
                    class="create-task-button" 
                    @click="createTask" 
                />
            </div>
            <div v-if="showParticipantPanel" class="participant-panel" :class="{ open: showParticipantPanel }">
                <div class="participant-panel-header">
                    <Button 
                        icon="pi pi-arrow-left" 
                        class="panel-close-button" 
                        @click="toggleParticipantPanel" 
                    />
                    <h4 class="participant-panel-title">Select participant</h4>
                </div>
                <div class="participant-search">
                    <InputText 
                        v-model="searchQuery" 
                        class="search-input" 
                        placeholder="Name or username" 
                    />
                </div>
                <div class="participant-list">
                    <div 
                        v-for="participant in filteredParticipants" 
                        :key="participant.username + '-' + participant.member_id" 
                        class="participant-item"
                    >
                        <Avatar 
                            v-if="isLoadingAvatars"
                            :label="participant.username.slice(0, 2).toUpperCase()"
                            size="medium" 
                            shape="circle" 
                            class="loading-avatar"
                        />
                        <Avatar 
                            v-else
                            :image="avatarUrls[String(participant.member_id)] || null"
                            :label="!avatarUrls[String(participant.member_id)] ? participant.username.slice(0, 2).toUpperCase() : null"
                            size="medium" 
                            shape="circle" 
                            :key="avatarUrls[String(participant.member_id)] || participant.username"
                        />
                        <span class="participant-name">{{ participant.name }}</span>
                        <Button 
                            icon="pi pi-plus" 
                            class="add-participant-button" 
                            @click="addParticipant(participant)" 
                        />
                    </div>
                    <div v-if="!filteredParticipants.length" class="no-participants">
                        No participants found
                    </div>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Calendar from 'primevue/calendar';
import Avatar from 'primevue/avatar';
import { useToast } from 'primevue/usetoast';
import { getMemberAvatar } from '../services/api';

const toast = useToast();

const props = defineProps({
    show: { type: Boolean, default: false },
    participants: { type: Array, default: () => [] },
    task: { type: Object, default: null },
    mode: { type: String, default: 'create' }, // 'create' или 'edit'
});

const emit = defineEmits(['update:show', 'add-task', 'update-task']);

const visible = ref(props.show);
const taskName = ref('');
const taskDescription = ref('');
const taskStartDate = ref(null);
const taskEndDate = ref(null);
const taskPriority = ref('Low');
const showParticipantPanel = ref(false);
const searchQuery = ref('');
const selectedParticipants = ref([]);
const originalTaskName = ref(null);

// Опции приоритета
const priorityOptions = ref([
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' }
]);

// Храним URL аватаров и состояние загрузки
const avatarUrls = ref({});
const avatarFailed = ref({});
const isLoadingAvatars = ref(false);

// Функция сброса формы
const resetForm = () => {
    taskName.value = '';
    taskDescription.value = '';
    taskStartDate.value = null;
    taskEndDate.value = null;
    taskPriority.value = 'Low';
    searchQuery.value = '';
    showParticipantPanel.value = false;
    selectedParticipants.value = [];
    avatarFailed.value = {};
    originalTaskName.value = null;
};

// Загрузка аватарок
const loadAvatars = async () => {
    isLoadingAvatars.value = true;
    // Очищаем только неиспользуемые blob URL
    const currentMemberIds = new Set(props.participants.map(p => String(p.member_id)).filter(id => id));
    Object.keys(avatarUrls.value).forEach(member_id => {
        if (!currentMemberIds.has(member_id)) {
            URL.revokeObjectURL(avatarUrls.value[member_id]);
            delete avatarUrls.value[member_id];
        }
    });

    const avatarPromises = props.participants.map(async (user, index) => {
        const memberId = String(user.member_id || 'unknown');
        try {
            const avatarUrl = await getMemberAvatar(memberId);
            return { index, member_id: memberId, avatarUrl, error: null };
        } catch (error) {
            console.warn(`TaskDialog - Failed to fetch avatar for member ${memberId}:`, error);
            return { index, member_id: memberId, avatarUrl: null, error };
        }
    });

    const results = await Promise.all(avatarPromises);
    results.forEach(({ member_id, avatarUrl, error }) => {
        if (avatarUrl) {
            avatarUrls.value[member_id] = avatarUrl;
        } else {
            avatarFailed.value[member_id] = true;
        }
    });

    isLoadingAvatars.value = false;
};

// Загружаем аватары при изменении participants
watch(() => props.participants, () => {
    loadAvatars();
}, { immediate: true, deep: true });

// Инициализация формы при получении задачи
watch(() => props.task, (newTask) => {
    if (newTask && props.mode === 'edit') {
        taskName.value = newTask.name;
        taskDescription.value = newTask.description;
        taskPriority.value = newTask.priority.charAt(0).toUpperCase() + newTask.priority.slice(1).toLowerCase();
        taskStartDate.value = newTask.start_at ? new Date(newTask.start_at) : null;
        taskEndDate.value = newTask.end_at ? new Date(newTask.end_at) : null;
        originalTaskName.value = newTask.name;
        selectedParticipants.value = props.participants.filter(p => 
            newTask.implementer_member_ids.includes(Number(p.member_id))
        );
    } else {
        resetForm();
    }
}, { immediate: true });

// Список участников с состоянием аватарок, исключая дубликаты
const participantsWithAvatarStatus = computed(() => {
    const uniqueParticipants = [];
    const seenUsernames = new Set();
    const usernameToParticipant = new Map();

    for (const participant of props.participants) {
        const username = participant.username;
        const current = usernameToParticipant.get(username);

        if (!current) {
            usernameToParticipant.set(username, participant);
        } else {
            if (
                (participant.member_id != null && current.member_id == null) ||
                (participant.system_role === 'OWNER' && current.system_role !== 'OWNER')
            ) {
                usernameToParticipant.set(username, participant);
            }
        }
    }

    for (const participant of usernameToParticipant.values()) {
        if (!seenUsernames.has(participant.username)) {
            seenUsernames.add(participant.username);
            uniqueParticipants.push({
                ...participant,
                member_id: participant.member_id ? String(participant.member_id) : null,
                avatarFailed: participant.member_id ? avatarFailed.value[String(participant.member_id)] || false : true,
            });
        }
    }

    return uniqueParticipants;
});

// Фильтрация участников
const filteredParticipants = computed(() => {
    if (!searchQuery.value) return participantsWithAvatarStatus.value;
    const query = searchQuery.value.toLowerCase();
    return participantsWithAvatarStatus.value.filter(participant =>
        participant.name.toLowerCase().includes(query) ||
        participant.username.toLowerCase().includes(query)
    );
});

const addParticipant = (participant) => {
    if (!selectedParticipants.value.find(p => p.username === participant.username)) {
        selectedParticipants.value.push({ ...participant, username: String(participant.username) });
        toast.add({ severity: 'success', summary: 'Participant Added', detail: `${participant.name} added to task`, life: 3000 });
    } else {
        toast.add({ severity: 'warn', summary: 'Duplicate', detail: `${participant.name} is already added`, life: 3000 });
    }
};

const removeParticipant = (participant) => {
    selectedParticipants.value = selectedParticipants.value.filter(p => p.username !== participant.username);
    toast.add({ severity: 'info', summary: 'Participant Removed', detail: `${participant.name} removed from task`, life: 3000 });
};

const closeForm = () => {
    visible.value = false;
    emit('update:show', false);
    resetForm();
};

const toggleParticipantPanel = () => {
    showParticipantPanel.value = !showParticipantPanel.value;
};

const setPriority = (value) => {
    taskPriority.value = value;
};

const createTask = () => {
    if (!taskName.value) {
        toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Task name is required', life: 3000 });
        return;
    }

    const task = {
        name: taskName.value,
        description: taskDescription.value || '',
        priority: taskPriority.value.toUpperCase(),
        start_at: taskStartDate.value ? new Date(taskStartDate.value).toISOString() : null,
        end_at: taskEndDate.value ? new Date(taskEndDate.value).toISOString() : null,
        implementer_member_ids: selectedParticipants.value
            .filter(p => p.member_id != null)
            .map(p => Number(p.member_id)),
    };

    if (props.mode === 'edit') {
        emit('update-task', { originalName: originalTaskName.value, updatedTask: task });
    } else {
        emit('add-task', task);
    }

    toast.add({ 
        severity: 'success', 
        summary: props.mode === 'edit' ? 'Task Updated' : 'Task Added', 
        detail: props.mode === 'edit' ? 'Task updated' : 'Task added to sprint', 
        life: 3000 
    });
    closeForm();
};
</script>

<style scoped>
.task-dialog {
    background: #f0f0f0;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
    padding: 0;
    margin: 0;
    z-index: 1000;
}

:deep(.p-dialog) {
    padding: 0 !important;
    margin: 0 !important;
    right: 0 !important;
}

:deep(.p-dialog-content) {
    padding: 0 !important;
    background: #f0f0f0;
    border-radius: 10px;
    overflow: hidden;
}

.task-form-container {
    flex: 1;
    padding: 20px;
    background: #f0f0f0;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-sizing: border-box;
    height: 100%;
    overflow-y: auto;
}

.task-close-button {
    position: absolute;
    top: 10px;
    left: 10px;
    background: transparent;
    border: none;
    color: #1D5C57;
    font-size: 18px;
}

.task-title {
    font-size: 20px;
    color: #1D5C57;
    margin: 0 0 20px 40px;
}

.task-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
}

.form-label {
    font-size: 16px;
    font-weight: bold;
    color: #1D5C57;
    text-align: left;
}

.form-input, .form-textarea {
    width: 100%;
    font-size: 14px;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ccc;
    box-sizing: border-box;
}

.date-pickers {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
}

.date-pickers :deep(.p-calendar) {
    width: 100%;
}

.date-pickers :deep(.p-inputtext) {
    width: 100%;
    box-sizing: border-box;
}

.priority-buttons {
    display: flex;
    gap: 10px;
    width: 100%;
    min-height: 40px;
}

.priority-button {
    flex: 1;
    font-size: 14px;
    padding: 8px;
    border: 1px solid #ccc;
    background: #ffffff;
    color: #333;
}

.priority-button.active.priority-low {
    background: #28a745;
    color: white;
    border-color: #28a745;
}

.priority-button.active.priority-medium {
    background: #ffc107;
    color: white;
    border-color: #ffc107;
}

.priority-button.active.priority-high {
    background: #dc3545;
    color: white;
    border-color: #dc3545;
}

.participant-selection {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.selected-participants {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.selected-participant-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.selected-participant-name {
    font-size: 14px;
    color: #1D5C57;
    flex: 1;
}

.remove-participant-button {
    background: transparent;
    border: none;
    color: #dc3545;
    font-size: 14px;
}

.remove-participant-button:hover {
    color: #b02a37;
}

.select-participant-button {
    background: transparent;
    border: none;
    color: #1F9D9B;
    font-size: 14px;
    text-decoration: underline;
    text-align: left;
    padding: 0;
    cursor: pointer;
    width: 70px;
}

.select-participant-button:hover {
    background: transparent;
    color: #2FBFBD;
}

.create-task-button {
    background: #1F9D9B;
    border: none;
    color: white;
    font-size: 16px;
    padding: 10px;
    border-radius: 12px;
    margin-top: auto;
    text-align: center;
}

.create-task-button:hover {
    background: #1D5C57;
}

.participant-panel {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: #f0f0f0;
    padding: 20px;
    height: 50%;
    overflow-y: auto;
    transform: translateY(100%);
    transition: transform 0.3s ease-in-out;
    z-index: 1000;
    border-top: 1px solid #ccc;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
}

.participant-panel.open {
    transform: translateY(0);
}

.participant-panel-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.panel-close-button {
    background: transparent;
    border: none;
    color: #1D5C57;
    font-size: 18px;
}

.participant-panel-title {
    font-size: 16px;
    color: #1D5C57;
    text-align: center;
    margin: 0;
    flex: 1;
}

.participant-search {
    margin-bottom: 10px;
}

.search-input {
    width: 100%;
    font-size: 14px;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ccc;
    box-sizing: border-box;
    text-align: center;
}

.participant-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.participant-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.participant-name {
    font-size: 14px;
    color: #1D5C57;
    flex: 1;
}

.add-participant-button {
    background: transparent;
    border: none;
    color: #1F9D9B;
    font-size: 14px;
}

.add-participant-button:hover {
    color: #2FBFBD;
}

.no-participants {
    font-size: 14px;
    color: #666;
    text-align: center;
}

.loading-avatar {
    opacity: 0.5;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 0.8; }
    100% { opacity: 0.5; }
}
</style>