<!-- src/components/ProjectDialog.vue -->
<template>
  <Dialog v-model:visible="visible" :style="{ width: '50vw' }" :modal="true" :draggable="false" :show-header="false"
    class="project-dialog">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">Failed to load project details</div>
    <div v-else class="dialog-content">
      <!-- Часть 1: Информация о проекте (60%) -->
      <div class="project-info">
        <Button icon="pi pi-times" class="close-button" @click="visible = false" />
        <Button v-if="isEditingDescription && isOwner" icon="pi pi-trash" class="delete-button"
          @click="confirmDeleteProject" />
        <h2 class="project-title">{{ projectData.name || 'Project name' }}</h2>
        <Button v-if="isOwner" icon="pi pi-pencil" class="edit-button" @click="startEditingDescription" />
        <div class="creator-info">
          <Avatar :image="avatarUrl"
            :label="!avatarUrl ? (projectData.owner?.slice(0, 2).toUpperCase() || 'CR') : ''" size="xlarge"
            shape="circle" />
          <span class="creator-name">{{ projectData.ownerFullName || projectData.owner || 'Creator Name' }}</span>
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
        <div class="sprint-label">Active sprints</div>
        <div class="active-sprints">
          <div class="current-sprint" v-for="sprint in activeSprints" :key="sprint.id" @click="showSprintDetails(sprint.id)">
            <ProgressCircle :progress="sprint.done_percents" />
            <div class="sprint-details">
              <div class="sprint-name">{{ sprint.name }}</div>
              <div class="sprint-deadline">{{ formatDeadline(sprint.end_time) }}</div>
            </div>
          </div>
          <div class="no-sprint" v-if="!activeSprints.length">
            <div class="no-sprint-text">No active sprints</div>
          </div>
        </div>
        <div class="completed-label">Completed sprints</div>
        <div class="completed-sprints">
          <div class="sprint-plaque" v-for="sprint in completedSprints" :key="sprint.id"
            @click="showSprintDetails(sprint.id)">
            <ProgressCircle :progress="100" />
            <div class="sprint-details">
              <div class="sprint-name">{{ sprint.name }}</div>
              <div class="sprint-deadline">{{ formatDeadline(sprint.end_time) }}</div>
            </div>
          </div>
          <div class="no-sprints" v-if="!completedSprints.length">
            No completed sprints
          </div>
        </div>
      </div>

      <!-- Часть 2: Динамическое содержимое (40%) -->
      <div class="users-info">
        <UsersInfo v-if="viewMode === 'users'" :project-data="projectData" :project-id="props.projectId"
          @show-sprint-form="viewMode = 'sprint'" @sprint-created="handleSprintCreated" />
        <SprintForm v-else-if="viewMode === 'sprint'" :project-data="projectData" @close-form="viewMode = 'users'"
          @sprint-created="handleSprintCreated" />
        <SprintDetails v-else-if="viewMode === 'sprint-details'" :sprint-data="selectedSprint" :project-id="props.projectId"
          @close-details="viewMode = 'users'" @sprint-deleted="handleSprintDeleted" @show-task-details="handleShowTaskDetails" />
        <TaskDetails v-else-if="viewMode === 'task-details'" :task-data="selectedTask" :project-id="props.projectId"
          :sprint-id="selectedSprintId" :project-data="projectData" @close-details="viewMode = 'sprint-details'" />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import InputText from 'primevue/inputtext';
import ProgressCircle from './ProgressCircle.vue';
import UsersInfo from './UsersInfo.vue';
import SprintForm from './SprintForm.vue';
import SprintDetails from './SprintDetails.vue';
import TaskDetails from './TaskDetails.vue';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { getProjectDetails, getUserData, getMemberAvatar, deleteProject, getProjectSprints } from '../services/api';

const toast = useToast();
const confirm = useConfirm();

const props = defineProps({
  show: { type: Boolean, default: false },
  projectId: { type: Number, default: null },
});

const emit = defineEmits(['update:show', 'project-deleted']);

const visible = ref(props.show);
const projectData = ref({});
const sprints = ref([]);
const loading = ref(false);
const error = ref(null);
const avatarUrl = ref(null);
const isOwner = ref(false);
const isEditingDescription = ref(false);
const editedDescription = ref('');
const viewMode = ref('users');
const selectedSprintId = ref(null);
const selectedTask = ref(null);

const activeSprints = computed(() => {
  const sprintsList = sprints.value
    .filter(sprint => !sprint.is_ended)
    .sort((a, b) => a.id - b.id); // Сортировка по id (старые выше)
  console.log('ProjectDialog - Computed activeSprints:', JSON.stringify(sprintsList, null, 2));
  return sprintsList;
});

const completedSprints = computed(() => {
  const completed = sprints.value.filter(sprint => sprint.is_ended);
  console.log('ProjectDialog - Computed completedSprints:', JSON.stringify(completed, null, 2));
  return completed;
});

const selectedSprint = computed(() => {
  const sprint = sprints.value.find(sprint => sprint.id === selectedSprintId.value) || {};
  console.log('ProjectDialog - Computed selectedSprint for ID:', selectedSprintId.value, JSON.stringify(sprint, null, 2));
  return sprint;
});

const fetchProjectDetails = async () => {
  if (!props.projectId) return;
  loading.value = true;
  error.value = null;
  try {
    // Получаем детали проекта
    const details = await getProjectDetails(props.projectId);
    console.log('ProjectDialog - Fetched project details:', JSON.stringify(details, null, 2));

    // Получаем спринты
    try {
      sprints.value = await getProjectSprints(props.projectId);
      console.log('ProjectDialog - Fetched sprints:', JSON.stringify(sprints.value, null, 2));
    } catch (err) {
      console.warn('ProjectDialog - Failed to fetch sprints:', err);
      sprints.value = [];
      toast.add({ severity: 'warn', summary: 'Warning', detail: 'Failed to load sprints', life: 3000 });
    }

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
    const ownerMember = details.others.find(member => member.system_role === 'OWNER');
    let owner = ownerMember?.user.username || 'Unknown';
    let ownerFullName = ownerMember ? `${ownerMember.user.name || ''} ${ownerMember.user.surname || ''}`.trim() : 'Unknown';
    const ownerId = ownerMember?.member_id;

    // Список участников
    let others = details.others || [];
    console.log('ProjectDialog - others (before modifications):', JSON.stringify(others, null, 2));

    // Проверяем дубликаты
    const uniqueUsernames = new Set(others.map(m => m.user.username));
    if (uniqueUsernames.size < others.length) {
      console.warn('ProjectDialog - Duplicate usernames detected:', others.map(m => m.user.username));
    }

    // Если текущий пользователь - участник (MEMBER), добавляем его в список
    isOwner.value = details.system_role === 'OWNER';
    if (details.system_role === 'MEMBER') {
      const isCurrentUserInOthers = others.some(member => member.user.username === currentUser.username);
      if (!isCurrentUserInOthers) {
        others.push({
          member_id: `current-${currentUser.username}`,
          system_role: 'MEMBER',
          descriptive_role: details.descriptive_role || 'Member',
          user: currentUser,
        });
      }
    }

    // Загружаем аватар владельца
    if (ownerId) {
      try {
        avatarUrl.value = await getMemberAvatar(ownerId);
        console.log('ProjectDialog - Fetched owner avatar:', avatarUrl.value);
      } catch (err) {
        console.warn('ProjectDialog - No owner avatar available:', err);
        avatarUrl.value = null;
      }
    } else {
      console.warn('ProjectDialog - Owner ID not found');
    }

    projectData.value = {
      id: details.project.id,
      name: details.project.name,
      owner: owner,
      ownerFullName: ownerFullName,
      description: details.project.description || '',
      others,
    };
    console.log('ProjectDialog - projectData:', JSON.stringify(projectData.value, null, 2));
  } catch (err) {
    error.value = err;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load project details', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const handleSprintCreated = (newSprint) => {
  console.log('ProjectDialog - Sprint created:', JSON.stringify(newSprint, null, 2));
  // Преобразуем SprintDTO в ShortSprintDTO
  const shortSprint = {
    id: newSprint.id,
    name: newSprint.name,
    description: newSprint.description || '',
    tasks: newSprint.tasks ? newSprint.tasks.length : 0,
    start_time: newSprint.start_at || new Date().toISOString(),
    end_time: newSprint.end_at || null,
    is_ended: false,
    is_started: newSprint.start_at ? new Date(newSprint.start_at) <= new Date() : true,
    done_percents: 0, // Начальный прогресс для нового спринта
  };
  console.log('ProjectDialog - Adding shortSprint:', JSON.stringify(shortSprint, null, 2));
  sprints.value = [...sprints.value, shortSprint];
  console.log('ProjectDialog - Updated sprints:', JSON.stringify(sprints.value, null, 2));
};

const handleSprintDeleted = (sprintId) => {
  console.log(`ProjectDialog - Handling sprint deletion for sprintId: ${sprintId}`);
  // Приводим sprintId к числу для корректного сравнения
  const idToDelete = Number(sprintId);
  // Создаём новый массив, исключая удалённый спринт
  sprints.value = sprints.value.filter(sprint => sprint.id !== idToDelete);
  console.log('ProjectDialog - Updated sprints after deletion:', JSON.stringify(sprints.value, null, 2));
};

const showSprintDetails = (sprintId) => {
  console.log('ProjectDialog - Opening sprint details for ID:', sprintId);
  selectedSprintId.value = sprintId;
  viewMode.value = 'sprint-details';
};

const handleShowTaskDetails = (task) => {
  console.log('ProjectDialog - Handling show task details for task ID:', task.id);
  selectedTask.value = task;
  viewMode.value = 'task-details';
};

const formatDeadline = (endTime) => {
  if (!endTime) return 'No deadline';
  return new Date(endTime).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
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

const confirmDeleteProject = () => {
  confirm.require({
    message: `Are you sure you want to delete the project "${projectData.value.name}"?`,
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Yes',
    rejectLabel: 'No',
    accept: async () => {
      try {
        await deleteProject(props.projectId);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Project deleted successfully',
          life: 3000,
        });
        emit('project-deleted', props.projectId);
        visible.value = false;
      } catch (error) {
        const status = error.status || error.response?.status;
        let message = error.message || 'Failed to delete project';
        if (status === 403) {
          message = 'You are not the project owner';
        } else if (status === 404) {
          message = 'Project not found';
        } else if (status === 500) {
          message = 'Server error: Unable to delete project. Please try again later.';
        }
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: message,
          life: 3000,
        });
        console.error('ProjectDialog - Delete project error:', JSON.stringify(error, null, 2));
      }
    },
    reject: () => {
      // Ничего не делаем при отмене
    },
  });
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
    viewMode.value = 'users';
    isEditingDescription.value = false;
    sprints.value = [];
    selectedSprintId.value = null;
    selectedTask.value = null;
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
  flex: 6;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
  position: relative;
  background: #f0f0f0;
  max-height: 80vh; /* Ограничиваем высоту для прокрутки */
}

.users-info {
  flex: 4;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #f0f0f0;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
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

.delete-button {
  position: absolute;
  top: 10px;
  left: 40px;
  background: transparent;
  border: none;
  color: #ff4d4f;
  font-size: 18px;
}

.delete-button:hover {
  color: #cc0000;
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

.active-sprints {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.current-sprint,
.sprint-plaque {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: row;
  gap: 10px;
  background: #1F9D9B;
  padding: 10px;
  border-radius: 8px;
  color: white;
  width: 80%;
  cursor: pointer;
  transition: transform 0.2s;
}

.current-sprint:hover,
.sprint-plaque:hover {
  transform: translateY(-2px);
}

.current-sprint.no-sprint {
  background: #666;
  justify-content: center;
  flex-direction: row;
}

.no-sprint-text {
  font-size: 14px;
  color: white;
}

.sprint-details {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.sprint-name {
  font-size: 16px;
  font-weight: bold;
}

.sprint-deadline {
  font-size: 14px;
}

.completed-sprints {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.no-sprints {
  font-size: 14px;
  color: #666;
  text-align: center;
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