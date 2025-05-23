<!-- src/components/SprintDetails.vue -->
<template>
  <div class="sprint-details-container">
    <!-- Кнопка закрытия -->
    <Button icon="pi pi-arrow-left" class="sprint-close-button" @click="closeDetails" />
    <!-- Заголовок спринта -->
    <h3 class="sprint-title">{{ sprintData.name || 'Sprint Name' }}</h3>
    <!-- Кнопка редактирования (карандаш) -->
    <Button icon="pi pi-pencil" class="edit-button" @click="editSprint" />
    <!-- Сроки работы -->
    <div class="term-label">Terms of work</div>
    <div class="term-date">{{ formatTerm }}</div>
    <!-- Описание -->
    <div class="description-label">Description</div>
    <div class="description-text">{{ sprintData.description || 'No description provided' }}</div>
    <!-- Задачи -->
    <div class="tasks-label">Tasks</div>
    <div class="task-list">
      <div v-if="loadingTasks" class="loading-tasks">Loading tasks...</div>
      <div v-else-if="tasksError" class="tasks-error">Failed to load tasks</div>
      <div v-else-if="!sortedTasks.length" class="no-tasks">No tasks assigned</div>
      <div v-else class="task-item" v-for="task in sortedTasks" :key="task.id" @click="showTaskDetails(task)">
        <div class="task-content" :class="[getPriorityClass(task.priority), { 'not-mine': !task.is_mine }]">
          <span class="task-name">{{ task.name }}</span>
          <span class="task-priority">{{ formatPriority(task.priority) }}</span>
        </div>
      </div>
    </div>
    <!-- Кнопка удаления спринта (внизу) -->
    <Button icon="pi pi-trash" label="Delete sprint" class="delete-sprint-button" @click="confirmDeleteSprint" />
    <!-- Компонент ConfirmDialog -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { getSprintDetails, deleteSprint } from '../services/api';

const toast = useToast();
const confirm = useConfirm();

const props = defineProps({
  sprintData: { type: Object, required: true },
  projectId: { type: Number, required: true },
  isOwner: { type: Boolean, default: false },
});

const emit = defineEmits(['close-details', 'sprint-deleted', 'show-task-details']);

const sprintData = ref(props.sprintData);
const loadingTasks = ref(false);
const tasksError = ref(null);

// Сортировка задач
const sortedTasks = computed(() => {
  if (!Array.isArray(sprintData.value.tasks)) {
    console.warn('SprintDetails - tasks is not an array:', sprintData.value.tasks);
    return [];
  }

  const priorityOrder = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const sorted = [...sprintData.value.tasks].sort((a, b) => {
    const aPriority = priorityOrder[a.priority?.toUpperCase()] || 0;
    const bPriority = priorityOrder[b.priority?.toUpperCase()] || 0;

    // Сначала задачи с is_mine: true, затем is_mine: false
    if (a.is_mine && !b.is_mine) return -1;
    if (!a.is_mine && b.is_mine) return 1;

    // Внутри групп сортируем по приоритету (от HIGH к LOW)
    return bPriority - aPriority;
  });

  console.log('SprintDetails - Sorted tasks:', JSON.stringify(sorted, null, 2));
  return sorted;
});

const fetchSprintDetails = async () => {
  loadingTasks.value = true;
  tasksError.value = null;
  try {
    const data = await getSprintDetails(props.projectId, props.sprintData.id);
    console.log('SprintDetails - Raw API response:', JSON.stringify(data, null, 2));
    sprintData.value = {
      ...sprintData.value,
      id: data.id,
      name: data.name,
      description: data.description,
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      start_time: data.start_at,
      end_time: data.end_at,
      done_percents: data.done_percents,
    };
    console.log('SprintDetails - Updated sprintData:', JSON.stringify(sprintData.value, null, 2));
    // Логируем приоритеты и is_mine для задач
    if (Array.isArray(sprintData.value.tasks)) {
      sprintData.value.tasks.forEach(task => {
        console.log(`SprintDetails - Task ID: ${task.id}, Priority: ${task.priority}, is_mine: ${task.is_mine}`);
      });
    } else {
      console.warn('SprintDetails - No valid tasks array in sprintData');
    }
  } catch (error) {
    tasksError.value = error;
    console.error('SprintDetails - Error fetching sprint details:', JSON.stringify(error, null, 2));
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load sprint tasks',
      life: 3000,
    });
  } finally {
    loadingTasks.value = false;
  }
};

onMounted(() => {
  console.log('SprintDetails - Mounted with sprint ID:', props.sprintData.id, 'isOwner:', props.isOwner);
  fetchSprintDetails();
});

// Отслеживаем смену sprintData.id
watch(
  () => props.sprintData.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      console.log('SprintDetails - Sprint ID changed from', oldId, 'to', newId);
      fetchSprintDetails();
    }
  }
);

const closeDetails = () => {
  console.log('SprintDetails - Closing details for sprint ID:', props.sprintData.id);
  emit('close-details');
};

const editSprint = () => {
  toast.add({
    severity: 'info',
    summary: 'Not Implemented',
    detail: 'Sprint editing will be implemented in the future',
    life: 3000,
  });
};

const showTaskDetails = (task) => {
  if (!task.is_mine && !props.isOwner) {
    console.log('SprintDetails - Attempt to open non-owned task ID:', task.id);
    toast.add({
      severity: 'warn',
      summary: 'Access Denied',
      detail: 'You cannot open tasks that are not assigned to you',
      life: 3000,
    });
    return;
  }
  console.log('SprintDetails - Showing task details for task ID:', task.id, 'isOwner:', props.isOwner);
  emit('show-task-details', task);
};

const confirmDeleteSprint = () => {
  console.log('SprintDetails - confirmDeleteSprint called for sprint:', sprintData.value.id);
  console.log('SprintDetails - Attempting to show ConfirmDialog');
  confirm.require({
    message: `Are you sure you want to delete the sprint "${sprintData.value.name}"? This will also delete all its tasks.`,
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Yes',
    rejectLabel: 'No',
    accept: async () => {
      console.log('SprintDetails - Deleting sprint:', props.projectId, props.sprintData.id);
      try {
        await deleteSprint(props.projectId, props.sprintData.id);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Sprint deleted successfully',
          life: 3000,
        });
        console.log('SprintDetails - Emitting sprint-deleted with ID:', props.sprintData.id);
        emit('sprint-deleted', props.sprintData.id);
        emit('close-details');
      } catch (error) {
        console.error('SprintDetails - Delete sprint error:', JSON.stringify(error, null, 2));
        const status = error.status || error.response?.status;
        let message = error.message || 'Failed to delete sprint';
        if (status === 403) {
          message = 'You do not have permission to delete this sprint';
        } else if (status === 404) {
          message = 'Sprint not found';
        }
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: message,
          life: 3000,
        });
      }
    },
    reject: () => {
      console.log('SprintDetails - Delete sprint cancelled');
    },
  });
};

// Форматирование сроков работы
const formatTerm = computed(() => {
  const start = sprintData.value.start_time
    ? new Date(sprintData.value.start_time).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
    : 'Not set';
  const end = sprintData.value.end_time
    ? new Date(sprintData.value.end_time).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
    : 'Not set';
  return `${start} - ${end}`;
});

// Форматирование приоритета
const formatPriority = (priority) => {
  if (!priority) return 'Unknown';
  switch (priority.toUpperCase()) {
    case 'LOW':
      return 'Low';
    case 'MEDIUM':
      return 'Medium';
    case 'HIGH':
      return 'High';
    default:
      return 'Unknown';
  }
};

// Класс для приоритета задачи
const getPriorityClass = (priority) => {
  switch (priority?.toUpperCase()) {
    case 'LOW':
      return 'priority-low';
    case 'MEDIUM':
      return 'priority-medium';
    case 'HIGH':
      return 'priority-high';
    default:
      return '';
  }
};
</script>

<style scoped>
.sprint-details-container {
  font-family: 'Source Sans 3', sans-serif;
  flex: 1;
  padding: 20px;
  background: #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 15px;
  box-sizing: border-box;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  position: relative;
  height: 100%;
  overflow-y: auto;
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
  text-align: center;
  margin: 0 40px;
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

.edit-button:hover {
  color: #2FBFBD;
}

.term-label,
.description-label,
.tasks-label {
  font-size: 16px;
  font-weight: bold;
  color: #1D5C57;
  text-align: left;
}

.term-date {
  font-size: 14px;
  color: #666;
  text-align: left;
}

.description-text {
  font-size: 14px;
  color: #333;
  text-align: left;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1; /* Растягиваем список задач, чтобы кнопка Delete была внизу */
}

.no-tasks,
.loading-tasks,
.tasks-error {
  font-size: 14px;
  color: #666;
  text-align: center;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-item:not(.not-mine), .task-item.is-owner {
  cursor: pointer; /* Кликабельно для своих задач или для OWNER */
}

.task-item.not-mine:not(.is-owner) {
  cursor: not-allowed; /* Курсор для чужих задач, если не OWNER */
}

.task-item:hover .task-content:not(.not-mine), .task-item:hover .task-content.is-owner {
  transform: translateY(-2px); /* Эффект при наведении для своих задач или OWNER */
}

.task-content {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Размещаем название и приоритет по краям */
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  position: relative;
  flex: 1;
  line-height: 1.3;
  background: linear-gradient(to right, #1F9D9B 50%, #28a745 50%);
  transition: transform 0.2s;
}

.task-content.priority-low {
  background: linear-gradient(to right, #1F9D9B 50%, #28a745 50%);
}

.task-content.priority-medium {
  background: linear-gradient(to right, #1F9D9B 50%, #ffc107 50%);
}

.task-content.priority-high {
  background: linear-gradient(to right, #1F9D9B 50%, #dc3545 50%);
}

.task-content.not-mine.priority-low {
  background: linear-gradient(to right, #909090 50%, #28a745 50%);
}

.task-content.not-mine.priority-medium {
  background: linear-gradient(to right, #909090 50%, #ffc107 50%);
}

.task-content.not-mine.priority-high {
  background: linear-gradient(to right, #909090 50%, #dc3545 50%);
}

.task-name {
  font-size: 13px;
  color: white;
  font-weight: bold;
  flex: 1; /* Название занимает доступное пространство */
}

.task-priority {
  font-size: 12px;
  color: white;
  font-weight: bold;
  text-transform: capitalize;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2); /* Полупрозрачный фон для читаемости */
}

.delete-sprint-button {
  background: transparent;
  border: none;
  color: #ff4d4f;
  font-size: 12px;
  text-align: center;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-top: auto; /* Устанавливаем кнопку внизу */
}

.delete-sprint-button:hover {
  color: #cc0000;
}
</style>