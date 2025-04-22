<!-- src/components/TaskDialog.vue -->
<template>
    <Dialog 
        v-model:visible="visible" 
        :style="{ width: '25vw', height: '82vh' }" 
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
                <SelectButton 
                    v-model="taskPriority" 
                    :options="priorityOptions" 
                    option-label="label" 
                    option-value="value" 
                    class="priority-selector" 
                    :class="{
                        'priority-low': taskPriority === 'Low',
                        'priority-medium': taskPriority === 'Medium',
                        'priority-high': taskPriority === 'High'
                    }" 
                />
                <div class="form-label">Select an participant for this task</div>
                <Button 
                    label="Select" 
                    class="select-participant-button" 
                    @click="toggleParticipantPanel" 
                />
                <Button 
                    label="Create a task" 
                    class="create-task-button" 
                    @click="createTask" 
                />
            </div>
            <div v-if="showParticipantPanel" class="participant-panel" :class="{ open: showParticipantPanel }">
                <h4 class="participant-panel-title">Select participant</h4>
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
                            :label="participant.username.slice(0, 2).toUpperCase()" 
                            size="medium" 
                            shape="circle" 
                        />
                        <span class="participant-name">{{ participant.name }}</span>
                        <Button 
                            icon="pi pi-plus" 
                            class="add-participant-button" 
                            @click="addParticipant" 
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
import SelectButton from 'primevue/selectbutton';
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

const priorityOptions = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
];

const filteredParticipants = computed(() => {
    if (!searchQuery.value) return props.participants;
    const query = searchQuery.value.toLowerCase();
    return props.participants.filter(participant =>
        participant.name.toLowerCase().includes(query) ||
        participant.username.toLowerCase().includes(query)
    );
});

const closeForm = () => {
    visible.value = false;
    emit('update:show', false);
    resetForm();
};

const toggleParticipantPanel = () => {
    showParticipantPanel.value = !showParticipantPanel.value;
};

const addParticipant = () => {
    toast.add({ severity: 'info', summary: 'Info', detail: 'Add participant functionality coming soon', life: 3000 });
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
    z-index: 1000; /* Чтобы не перекрывать ProjectDialog.vue */
}

:deep(.p-dialog) {
    padding: 0 !important;
    margin: 0 !important;
    right: 0 !important; /* Прижать к правому краю */
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

.priority-selector {
    width: 100%;
}

.priority-selector :deep(.p-button) {
    font-size: 14px;
    padding: 8px;
    border: 1px solid #ccc;
}

.priority-selector.priority-low :deep(.p-button.p-highlight) {
    background: #28a745 !important; /* Зелёный */
    color: white !important;
    border-color: #28a745 !important;
}

.priority-selector.priority-medium :deep(.p-button.p-highlight) {
    background: #ffc107 !important; /* Жёлтый */
    color: white !important;
    border-color: #ffc107 !important;
}

.priority-selector.priority-high :deep(.p-button.p-highlight) {
    background: #dc3545 !important; /* Красный */
    color: white !important;
    border-color: #dc3545 !important;
}

.priority-selector :deep(.p-button:not(.p-highlight)) {
    background: #e0e0e0;
    color: #333;
    border-color: #ccc;
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
    width: 70px; /* Соответствует Add task */
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
    max-height: 50vh;
    overflow-y: auto;
    transform: translateY(0);
    transition: transform 0.3s ease-in-out;
    z-index: 10;
    border-top: 1px solid #ccc;
}

.participant-panel.open {
    transform: translateY(-100%);
}

.participant-panel-title {
    font-size: 16px;
    color: #1D5C57;
    text-align: center;
    margin: 0 0 10px;
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