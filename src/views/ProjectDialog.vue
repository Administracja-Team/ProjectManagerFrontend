<!-- src/components/ProjectDialog.vue -->
<template>
    <Dialog v-model:visible="visible" :style="{ width: '50vw' }" :modal="true" :draggable="false" :show-header="false" class="project-dialog">
        <div class="dialog-content">
            <!-- Часть 1: Информация о проекте (2/3) -->
            <div class="project-info">
                <Button icon="pi pi-times" class="close-button" @click="visible = false" />
                <h2 class="project-title">Project name</h2>
                <Button icon="pi pi-pencil" class="edit-button" @click="editProject" />
                <div class="creator-info">
                    <Avatar label="CR" size="large" />
                    <span class="creator-name">Creator Name</span>
                </div>
                <div class="term-label">Term of work</div>
                <div class="term-date">TBD</div>
                <div class="goal-label">Project goal and description</div>
                <div class="goal-text">Project description goes here...</div>
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

            <!-- Часть 2: Информация о пользователях (1/3) -->
            <div class="users-info">
                <h3>Connected Users</h3>
                <p>Placeholder for user list...</p>
            </div>
        </div>
    </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import ProgressCircle from './ProgressCircle.vue';

const props = defineProps({
    show: { type: Boolean, default: false },
    project: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['update:show']);

const visible = ref(props.show);

watch(() => props.show, (newVal) => {
    visible.value = newVal;
});
watch(visible, (newVal) => {
    emit('update:show', newVal);
});

const editProject = () => {
    console.log('Edit project clicked');
};
</script>

<style scoped>
.project-dialog {
    background: #f0f0f0;
    border-radius: 10px;
    padding-top: 0; /* Убираем отступ сверху */
}

.dialog-content {
    display: flex;
    height: 80vh;
    overflow: hidden;
}

.project-info {
    flex: 2; /* 2/3 ширины */
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    overflow-y: auto;
    position: relative; /* Для позиционирования кнопок */
}

.users-info {
    flex: 1; /* 1/3 ширины */
    padding: 20px;
    background: #e0e0e0;
    border-left: 1px solid #ccc;
}

.project-title {
    text-align: center;
    margin: 0;
    color: #1F9D9B;
    font-size: 24px;
    line-height: 30px; /* Для выравнивания с кнопками */
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
    justify-content: center;
}

.creator-name {
    font-size: 18px;
    color: #1D5C57;
}

.term-label, .goal-label {
    font-size: 16px;
    font-weight: bold;
    color: #1D5C57;
    text-align: left;
}

.sprint-label, .completed-label {
    font-size: 16px;
    font-weight: bold;
    color: #1D5C57;
    text-align: center;
    font-family: 'Calibri', sans-serif;
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

.current-sprint, .sprint-plaque {
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

.sprint-name, .sprint-deadline {
    font-size: 12px;
}

.completed-sprints {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
}
</style>