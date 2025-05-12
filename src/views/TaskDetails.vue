<!-- src/components/TaskDetails.vue -->
<template>
  <div class="task-details-container">
    <!-- Кнопка закрытия -->
    <Button icon="pi pi-arrow-left" class="task-close-button" @click="closeDetails" />
    <!-- Заголовок задачи -->
    <h3 class="task-title">{{ taskData.name || 'Task Name' }}</h3>
    <!-- Кнопка редактирования (карандаш) -->
    <Button icon="pi pi-pencil" class="edit-button" @click="editTask" />
    <!-- Описание -->
    <div class="description-label">Description</div>
    <div class="description-text">{{ taskData.description || 'No description provided' }}</div>
    <!-- Приоритет -->
    <div class="priority-label">Priority</div>
    <div class="priority-plaque" :class="getPriorityClass(taskData.priority)">
      {{ formatPriority(taskData.priority) }}
    </div>
    <!-- Статус -->
    <div class="status-label">Status</div>
    <div class="status-buttons">
      <Button
        v-for="option in statusOptions"
        :key="option.value"
        :label="option.label"
        :class="{
          'status-button': true,
          'active': taskStatus === option.value,
          'status-todo': option.value === 'TODO',
          'status-in-progress': option.value === 'IN_PROGRESS',
          'status-done': option.value === 'DONE'
        }"
        @click="setStatus(option.value)"
      />
    </div>
    <!-- Участники -->
    <div class="participants-label">Participant for the task</div>
    <div class="participants-list">
      <div v-if="loadingParticipants" class="loading-participants">Loading participants...</div>
      <div v-else-if="participantsError" class="participants-error">Failed to load participants</div>
      <div v-else-if="!participants.length" class="no-participants">No participants assigned</div>
      <div v-else class="user-item" v-for="participant in participants" :key="participant.member_id">
        <div class="user-content">
          <Avatar v-if="isLoadingAvatars" :label="participant.user.username.slice(0, 2).toUpperCase()" size="medium" shape="circle" class="loading-avatar" />
          <Avatar v-else
                  :image="avatarUrls[participant.member_id] || null"
                  :label="!avatarUrls[participant.member_id] ? participant.user.username.slice(0, 2).toUpperCase() : null"
                  size="medium" shape="circle" class="user-avatar" />
          <div class="user-info">
            <span class="user-fullname">{{ participant.user.name }} {{ participant.user.surname }}</span>
            <span class="user-system-role">({{ participant.system_role }})</span>
            <span class="user-descriptive-role">{{ participant.descriptive_role || '' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import { useToast } from 'primevue/usetoast';
import { getMemberAvatar, changeTaskStatus } from '../services/api';

const toast = useToast();

const props = defineProps({
  taskData: { type: Object, required: true },
  projectId: { type: Number, required: true },
  sprintId: { type: Number, required: true },
  projectData: { type: Object, required: true }, // Для доступа к others
});

const emit = defineEmits(['close-details', 'task-status-changed']);

const taskData = ref(props.taskData);
const participants = ref([]);
const avatarUrls = ref({});
const avatarFailed = ref({});
const isLoadingAvatars = ref(false);
const loadingParticipants = ref(false);
const participantsError = ref(null);

// Статус задачи
const taskStatus = ref(taskData.value.status?.toUpperCase() || 'TODO');

// Опции статуса
const statusOptions = ref([
  { label: 'TODO', value: 'TODO' },
  { label: 'IN_PROGRESS', value: 'IN_PROGRESS' },
  { label: 'DONE', value: 'DONE' }
]);

const fetchParticipants = async () => {
  loadingParticipants.value = true;
  participantsError.value = null;
  participants.value = [];
  isLoadingAvatars.value = true;
  avatarUrls.value = {};
  avatarFailed.value = {};

  try {
    // Сопоставляем implementers с projectData.others
    const implementers = taskData.value.implementers || [];
    const others = props.projectData.others || [];

    for (const implementer of implementers) {
      const member = others.find(m => m.member_id === implementer.id);
      if (member) {
        participants.value.push({
          member_id: member.member_id,
          system_role: member.system_role,
          descriptive_role: member.descriptive_role,
          user: {
            username: member.user.username,
            name: member.user.name || 'Unknown',
            surname: member.user.surname || '',
          },
        });
      }
    }

    // Загружаем аватарки
    const avatarPromises = participants.value.map(async (participant) => {
      try {
        const avatarUrl = await getMemberAvatar(participant.member_id);
        return { member_id: participant.member_id, avatarUrl, error: null };
      } catch (error) {
        console.warn(`TaskDetails - Failed to fetch avatar for member ${participant.member_id}:`, error);
        return { member_id: participant.member_id, avatarUrl: null, error };
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

    console.log('TaskDetails - Fetched participants:', JSON.stringify(participants.value, null, 2));
    console.log('TaskDetails - Fetched avatarUrls:', JSON.stringify(avatarUrls.value, null, 2));
  } catch (error) {
    participantsError.value = error;
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load participants',
      life: 3000,
    });
  } finally {
    loadingParticipants.value = false;
    isLoadingAvatars.value = false;
  }
};

onMounted(() => {
  console.log('TaskDetails - Mounted with task ID:', taskData.value.id);
  console.log('TaskDetails - Task status:', taskStatus.value);
  fetchParticipants();
});

const closeDetails = () => {
  console.log('TaskDetails - Closing details for task ID:', taskData.value.id);
  emit('close-details');
};

const editTask = () => {
  toast.add({
    severity: 'info',
    summary: 'Not Implemented',
    detail: 'Task editing will be implemented in the future',
    life: 3000,
  });
};

// Установка статуса с отправкой на сервер
const setStatus = async (value) => {
  try {
    await changeTaskStatus(props.projectId, props.sprintId, taskData.value.id, value);
    taskStatus.value = value;
    toast.add({
      severity: 'success',
      summary: 'Status Updated',
      detail: `Task status changed to ${value}`,
      life: 3000,
    });
    // Отправляем событие для обновления спринтов
    emit('task-status-changed', {
      taskId: taskData.value.id,
      sprintId: props.sprintId,
      newStatus: value,
    });
  } catch (error) {
    console.error(`TaskDetails - Failed to change status to ${value}:`, error);
    const message = error.message || 'Failed to change task status';
    const status = error.status || 500;
    let detail = message;
    if (status === 400) {
      detail = 'Invalid status format';
    } else if (status === 403) {
      detail = 'Not enough permissions';
    } else if (status === 404) {
      detail = 'Task, Sprint, or Project not found';
    }
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail,
      life: 3000,
    });
  }
};

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

// Класс для приоритета
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
.task-details-container {
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

.description-label,
.priority-label,
.status-label,
.participants-label {
  font-size: 16px;
  font-weight: bold;
  color: #1D5C57;
  text-align: left;
}

.description-text {
  font-size: 14px;
  color: #333;
  text-align: left;
}

.priority-plaque {
  font-size: 14px;
  color: white;
  font-weight: bold;
  text-transform: capitalize;
  padding: 8px;
  border-radius: 8px;
  text-align: center;
  margin: 0 10px; /* Небольшие отступы */
}

.priority-plaque.priority-low {
  background: #28a745; /* Зелёный */
}

.priority-plaque.priority-medium {
  background: #ffc107; /* Жёлтый */
}

.priority-plaque.priority-high {
  background: #dc3545; /* Красный */
}

.status-buttons {
  display: flex;
  gap: 10px;
  width: 100%;
  min-height: 40px;
}

.p-button.status-button {
  flex: 1;
  font-size: 11px !important; /* Уменьшенный размер текста для IN_PROGRESS */
  padding: 8px;
  border: 1px solid #ccc;
  background: #ffffff;
  color: #333;
  white-space: nowrap; /* Предотвращаем перенос текста */
  min-width: 80px; /* Минимальная ширина кнопки */
  text-align: center;
  outline: 1px solid transparent; /* Для отладки применения стиля */
}

.p-button.status-button.active.status-todo {
  background: #dc3545; /* Красный, как priority-high */
  color: white;
  border-color: #dc3545;
}

.p-button.status-button.active.status-in-progress {
  background: #ffc107; /* Жёлтый, как priority-medium */
  color: white;
  border-color: #ffc107;
}

.p-button.status-button.active.status-done {
  background: #28a745; /* Зелёный, как priority-low */
  color: white;
  border-color: #28a745;
}

.participants-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1; /* Растягиваем список участников */
}

.no-participants,
.loading-participants,
.participants-error {
  font-size: 14px;
  color: #666;
  text-align: left;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.user-item:hover {
  background: #e0e0e0;
  border-radius: 8px;
}

.user-content {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
}

.user-avatar, .loading-avatar {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: calc(100% - 60px);
}

.user-fullname {
  font-size: 14px;
  color: #1D5C57;
  font-weight: 500;
  word-break: break-word;
}

.user-system-role {
  font-size: 12px;
  color: #1D5C57;
}

.user-descriptive-role {
  font-size: 12px;
  color: #666;
  word-break: break-word;
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