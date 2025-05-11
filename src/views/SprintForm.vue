<!-- src/components/SprintForm.vue -->
<template>
    <div class="sprint-form-container">
        <Button 
            icon="pi pi-arrow-left" 
            class="sprint-close-button" 
            @click="closeForm" 
        />
        <h3 class="sprint-title">New sprint</h3>
        <div class="sprint-form">
            <div class="form-label">Name</div>
            <InputText 
                v-model="sprintName" 
                class="form-input" 
                placeholder="Sprint name" 
            />
            <div class="form-label">Description</div>
            <Textarea 
                v-model="sprintDescription" 
                class="form-textarea" 
                placeholder="Sprint description" 
                :auto-resize="true" 
                rows="4" 
            />
            <div class="form-label">Work period</div>
            <div class="date-pickers">
                <Calendar 
                    v-model="sprintStartDate" 
                    :show-icon="true" 
                    placeholder="Start date" 
                    date-format="dd/mm/yy" 
                />
                <Calendar 
                    v-model="sprintEndDate" 
                    :show-icon="true" 
                    placeholder="End date" 
                    date-format="dd/mm/yy" 
                />
            </div>
            <div class="form-label">Tasks</div>
            <div class="selected-tasks">
                <div 
                    v-for="task in tasks" 
                    :key="task.name" 
                    class="task-row"
                >
                    <div 
                        class="selected-task-item"
                        :class="getPriorityClass(task.priority)"
                        @click="editTask(task)"
                    >
                        <span class="selected-task-name">{{ task.name }}</span>
                        <span class="selected-task-deadline">{{ formatDeadline(task.end_at) }}</span>
                    </div>
                    <Button 
                        icon="pi pi-times" 
                        class="remove-task-button" 
                        @click.stop="removeTask(task)" 
                    />
                </div>
            </div>
            <Button 
                label="Add task" 
                class="add-task-button" 
                @click="showTaskForm = true" 
            />
            <Button 
                label="Create a sprint" 
                class="create-sprint-button" 
                @click="handleCreateSprint" 
            />
        </div>
        <TaskDialog 
            v-if="showTaskForm" 
            :show="showTaskForm" 
            :participants="participants" 
            :task="editingTask" 
            :mode="editingTask ? 'edit' : 'create'" 
            @update:show="showTaskForm = $event" 
            @add-task="addTask" 
            @update-task="updateTask"
        />
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Calendar from 'primevue/calendar';
import TaskDialog from './TaskDialog.vue';
import { useToast } from 'primevue/usetoast';
import { createSprint } from '../services/api';

const toast = useToast();
const route = useRoute();

const emit = defineEmits(['close-form', 'sprint-created']);

const sprintName = ref('');
const sprintDescription = ref('');
const sprintStartDate = ref(null);
const sprintEndDate = ref(null);
const showTaskForm = ref(false);
const tasks = ref([]);
const editingTask = ref(null);

const props = defineProps({
    projectData: { type: Object, default: () => ({}) },
});

const participants = computed(() => {
    const result = [];
    const seenUsernames = new Set();
    const usernameToParticipant = new Map();

    if (props.projectData.owner) {
        const owner = {
            username: props.projectData.owner,
            name: props.projectData.ownerFullName || props.projectData.owner,
            system_role: 'OWNER',
            member_id: props.projectData.ownerMemberId ? String(props.projectData.ownerMemberId) : null,
        };
        usernameToParticipant.set(owner.username, owner);
    }

    if (props.projectData.others?.length) {
        for (const member of props.projectData.others) {
            const participant = {
                username: member.user.username,
                name: `${member.user.name} ${member.user.surname}`.trim(),
                system_role: member.system_role,
                member_id: member.member_id ? String(member.member_id) : null,
            };
            const current = usernameToParticipant.get(participant.username);
            if (!current) {
                usernameToParticipant.set(participant.username, participant);
            } else if (
                (participant.member_id !== null && current.member_id === null) ||
                (participant.system_role === 'OWNER' && current.system_role !== 'OWNER')
            ) {
                usernameToParticipant.set(participant.username, participant);
            }
        }
    }

    for (const participant of usernameToParticipant.values()) {
        if (!seenUsernames.has(participant.username)) {
            result.push(participant);
            seenUsernames.add(participant.username);
        }
    }

    return result;
});

const addTask = (task) => {
    tasks.value.push(task);
    toast.add({ severity: 'success', summary: 'Task Added', detail: `${task.name} added to sprint`, life: 3000 });
};

const removeTask = (task) => {
    tasks.value = tasks.value.filter(t => t.name !== task.name);
    toast.add({ severity: 'info', summary: 'Task Removed', detail: `${task.name} removed from sprint`, life: 3000 });
};

const editTask = (task) => {
    editingTask.value = task;
    showTaskForm.value = true;
};

const updateTask = ({ originalName, updatedTask }) => {
    tasks.value = tasks.value.map(task => 
        task.name === originalName ? updatedTask : task
    );
    editingTask.value = null;
    showTaskForm.value = false;
    toast.add({ severity: 'success', summary: 'Task Updated', detail: `${updatedTask.name} updated`, life: 3000 });
};

const closeForm = () => {
    emit('close-form');
    resetForm();
};

const handleCreateSprint = async () => {
    console.log('SprintForm - projectData:', JSON.stringify(props.projectData, null, 2));

    if (!sprintName.value) {
        toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Sprint name is required', life: 3000 });
        return;
    }

    if (sprintStartDate.value && sprintEndDate.value && new Date(sprintEndDate.value) < new Date(sprintStartDate.value)) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Validation Error', 
            detail: 'End date must be after start date', 
            life: 3000 
        });
        return;
    }

    if (!tasks.value.length) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Validation Error', 
            detail: 'At least one task is required', 
            life: 3000 
        });
        return;
    }

    let projectId = props.projectData.project_id || props.projectData.id;
    if (!projectId && route.params.id) {
        projectId = Number(route.params.id);
    }

    if (!projectId) {
        toast.add({ severity: 'error', summary: 'Invalid Project', detail: 'Project ID is missing', life: 3000 });
        console.error('SprintForm - Missing project_id:', JSON.stringify(props.projectData, null, 2));
        return;
    }

    const sprint = {
        name: sprintName.value,
        description: sprintDescription.value || '',
        tasks: tasks.value,
        start_at: sprintStartDate.value ? new Date(sprintStartDate.value).toISOString() : null,
        end_at: sprintEndDate.value ? new Date(sprintEndDate.value).toISOString() : null,
    };

    console.log('SprintForm - Creating sprint for projectId:', projectId, 'data:', JSON.stringify(sprint, null, 2));

    try {
        const response = await createSprint(projectId, sprint);
        console.log('SprintForm - Sprint created:', JSON.stringify(response, null, 2));
        toast.add({ 
            severity: 'success', 
            summary: 'Sprint Created', 
            detail: 'Sprint created successfully', 
            life: 3000 
        });
        emit('sprint-created', response);
        closeForm();
    } catch (error) {
        console.error('SprintForm - Failed to create sprint:', {
            status: error.status,
            message: error.message,
            projectId,
            data: error.data ? JSON.stringify(error.data, null, 2) : 'No data',
        });
        if (error.status === 403) {
            toast.add({ 
                severity: 'error', 
                summary: 'Permission Denied', 
                detail: 'You do not have permission to create a sprint', 
                life: 3000 
            });
        } else if (error.status === 404) {
            toast.add({ 
                severity: 'error', 
                summary: 'Project Not Found', 
                detail: `Project with ID ${projectId} was not found`, 
                life: 3000 
            });
        } else {
            toast.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: error.message || 'Failed to create sprint', 
                life: 3000 
            });
        }
    }
};

const resetForm = () => {
    sprintName.value = '';
    sprintDescription.value = '';
    sprintStartDate.value = null;
    sprintEndDate.value = null;
    tasks.value = [];
    editingTask.value = null;
};

const getPriorityClass = (priority) => {
    switch (priority) {
        case 'LOW': return 'priority-low';
        case 'MEDIUM': return 'priority-medium';
        case 'HIGH': return 'priority-high';
        default: return '';
    }
};

const formatDeadline = (endAt) => {
    if (!endAt) return 'No deadline';
    return new Date(endAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });
};
</script>

<style scoped>
.sprint-form-container {
    flex: 1;
    padding: 20px;
    background: #f0f0f0;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-sizing: border-box;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
}

.sprint-close-button {
    position: absolute;
    top: 10px;
    left: 10px;
    background: transparent;
    border: none;
    color: #1D5C57;
    font-size: 18px;
}

.sprint-title {
    font-size: 20px;
    color: #1D5C57;
    margin: 0 0 20px 40px;
}

.sprint-form {
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

.selected-tasks {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.task-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.selected-task-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    transition: transform 0.2s;
    flex: 1;
    line-height: 1.3;
}

.selected-task-item:hover {
    transform: translateY(-2px);
}

.selected-task-item.priority-low {
    background: linear-gradient(to right, #1F9D9B 50%, #28a745 50%);
}

.selected-task-item.priority-medium {
    background: linear-gradient(to right, #1F9D9B 50%, #ffc107 50%);
}

.selected-task-item.priority-high {
    background: linear-gradient(to right, #1F9D9B 50%, #dc3545 50%);
}

.selected-task-name {
    font-size: 13px;
    color: white;
    flex: 1;
    font-weight: bold;
}

.selected-task-deadline {
    font-size: 13px;
    color: white;
    flex: 1;
    text-align: right;
    font-weight: bold;
}

.remove-task-button {
    background: transparent;
    border: none;
    color: #dc3545;
    font-size: 14px;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.remove-task-button:hover {
    color: #b02a37;
}

.add-task-button {
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

.add-task-button:hover {
    background: transparent;
    color: #2FBFBD;
}

.create-sprint-button {
    background: #1F9D9B;
    border: none;
    color: white;
    font-size: 16px;
    padding: 10px;
    border-radius: 12px;
    margin-top: auto;
    text-align: center;
}

.create-sprint-button:hover {
    background: #1D5C57;
}
</style>