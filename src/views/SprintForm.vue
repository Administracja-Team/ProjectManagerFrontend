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
            <Button 
                label="Add task" 
                class="add-task-button" 
                @click="showTaskForm = true" 
            />
            <Button 
                label="Create a sprint" 
                class="create-sprint-button" 
                @click="createSprint" 
            />
        </div>
        <TaskDialog 
            v-if="showTaskForm" 
            :show="showTaskForm" 
            :participants="participants" 
            @update:show="showTaskForm = $event" 
        />
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Calendar from 'primevue/calendar';
import TaskDialog from './TaskDialog.vue';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const emit = defineEmits(['close-form']);

const sprintName = ref('');
const sprintDescription = ref('');
const sprintStartDate = ref(null);
const sprintEndDate = ref(null);
const showTaskForm = ref(false);

// Данные участников из ProjectDialog.vue (предполагается, что они передаются через props)
const props = defineProps({
    projectData: { type: Object, default: () => ({}) },
});

const participants = computed(() => {
    const result = [];
    if (props.projectData.owner) {
        result.push({
            username: props.projectData.owner,
            name: props.projectData.ownerFullName || props.projectData.owner,
            system_role: 'OWNER',
        });
    }
    if (props.projectData.others?.length) {
        result.push(...props.projectData.others.map(member => ({
            username: member.user.username,
            name: `${member.user.name} ${member.user.surname}`.trim(),
            system_role: member.system_role,
        })));
    }
    return result;
});

const closeForm = () => {
    emit('close-form');
};

const createSprint = () => {
    toast.add({ severity: 'info', summary: 'Info', detail: 'Create sprint functionality coming soon', life: 3000 });
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
    border-top-right-radius: 10px; /* Закругление правого верхнего угла */
    border-bottom-right-radius: 10px; /* Закругление правого нижнего угла */
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
    margin: 0 0 20px 40px; /* Отступ слева для выравнивания с кнопкой */
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
    flex-direction: column; /* Вертикальное размещение */
    gap: 10px;
    width: 100%;
}

.date-pickers :deep(.p-calendar) {
    width: 100%; /* Полная ширина */
}

.date-pickers :deep(.p-inputtext) {
    width: 100%; /* Полная ширина поля ввода */
    box-sizing: border-box;
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
}

.add-task-button:hover {
    background: transparent; /* Без фона при наведении */
    color: #2FBFBD; /* Светлее, чем #1F9D9B */
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