<!-- src/components/TaskDialog.vue -->
<template>
    <Dialog 
        v-model:visible="visible" 
        :style="{ width: '24vw', height: '82vh' }" 
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
            <h3 class="task-title">New task</h3>
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
                <div class="form-label">Select an participant for this task</div>
                <div class="participant-selection">
                    <div class="selected-participants">
                        <div 
                            v-for="participant in selectedParticipants" 
                            :key="participant.username" 
                            class="selected-participant-item"
                        >
                            <Avatar 
                                :image="participant.member_id && !avatarFailed[participant.member_id] ? `/project/member/${participant.member_id}/avatar?t=${Date.now()}` : null"
                                :label="avatarFailed[participant.member_id] || !participant.member_id ? participant.username.slice(0, 2).toUpperCase() : null"
                                size="medium" 
                                shape="circle" 
                                @error="handleAvatarError(participant.member_id, participant.name)"
                            />
                            <span class="selected-participant-name">{{ participant.name }}</span>
                            <Button 
                                icon="pi pi-times" 
                                class="remove-participant-button" 
                                @click="removeParticipant(participant.username)" 
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
                    label="Create a task" 
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
                        :key="participant.username" 
                        class="participant-item"
                    >
                        <Avatar 
                            :image="participant.member_id && !avatarFailed[participant.member_id] ? `/project/member/${participant.member_id}/avatar?t=${Date.now()}` : null"
                            :label="avatarFailed[participant.member_id] || !participant.member_id ? participant.username.slice(0, 2).toUpperCase() : null"
                            size="medium" 
                            shape="circle" 
                            @error="handleAvatarError(participant.member_id, participant.name)"
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

const toast = useToast();

const props = defineProps({
    show: { type: Boolean, default: false },
    participants: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:show']);

const visible = ref(props.show);
const taskName = ref('');
const taskDescription = ref('');
const taskStartDate = ref(null);
const taskEndDate = ref(null);
const taskPriority = ref('Low');
const showParticipantPanel = ref(false);
const searchQuery = ref('');
const selectedParticipants = ref([]);

// Храним состояние ошибок аватарок по member_id
const avatarFailed = ref({});

// Список участников с состоянием аватарок
const participantsWithAvatarStatus = computed(() => {
    return props.participants.map(participant => ({
        ...participant,
        avatarFailed: avatarFailed.value[participant.member_id] || false,
    }));
});

// Обработка ошибки загрузки аватарки
const handleAvatarError = (member_id, name) => {
    if (member_id) {
        avatarFailed.value[member_id] = true;
    }
};

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
        selectedParticipants.value.push({ ...participant });
        toast.add({ severity: 'success', summary: 'Participant Added', detail: `${participant.name} added to task`, life: 3000 });
    } else {
        toast.add({ severity: 'warn', summary: 'Duplicate', detail: `${participant.name} is already added`, life: 3000 });
    }
};

const removeParticipant = (username) => {
    selectedParticipants.value = selectedParticipants.value.filter(p => p.username !== username);
    toast.add({ severity: 'info', summary: 'Participant Removed', detail: 'Participant removed from task', life: 3000 });
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
    toast.add({ severity: 'info', summary: 'Info', detail: 'Create task functionality coming soon', life: 3000 });
};

const resetForm = () => {
    taskName.value = '';
    taskDescription.value = '';
    taskStartDate.value = null;
    taskEndDate.value = null;
    taskPriority.value = 'Low';
    searchQuery.value = '';
    showParticipantPanel.value = false;
    selectedParticipants.value = [];
    avatarFailed.value = {}; // Сбрасываем ошибки аватарок
};

watch(() => props.show, (newVal) => {
    visible.value = newVal;
    if (!newVal) resetForm();
});
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
    z-index: 10;
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
</style>