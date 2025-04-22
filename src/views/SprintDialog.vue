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
            <InputText 
                v-model="sprintDescription" 
                class="form-input" 
                placeholder="Sprint description" 
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
                @click="addTask" 
            />
            <Button 
                label="Create a sprint" 
                class="create-sprint-button" 
                @click="createSprint" 
            />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const emit = defineEmits(['close-form']);

const sprintName = ref('');
const sprintDescription = ref('');
const sprintStartDate = ref(null);
const sprintEndDate = ref(null);

const closeForm = () => {
    emit('close-form');
};

const addTask = () => {
    toast.add({ severity: 'info', summary: 'Info', detail: 'Add task functionality coming soon', life: 3000 });
};

const createSprint = () => {
    toast.add({ severity: 'info', summary: 'Info', detail: 'Create sprint functionality coming soon', life: 3000 });
};
</script>

<style scoped>
.sprint-form-container {
    flex: 1;
    padding: 20px;
    background: #e0e0e0;
    border-left: 1px solid #ccc;
    display: flex;
    flex-direction: column;
    gap: 20px;
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

.form-input {
    width: 100%;
    font-size: 14px;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ccc;
}

.date-pickers {
    display: flex;
    gap: 10px;
}

.date-pickers :deep(.p-calendar) {
    width: 50%;
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
    color: #1D5C57;
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