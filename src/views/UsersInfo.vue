<!-- src/components/UsersInfo.vue -->
<template>
    <div class="users-info">
        <h3 class="participants-title">Participants</h3>
        <div class="user-list">
            <!-- Создатель -->
            <div class="user-item" @click="openRoleDialog(ownerMemberId, projectData.ownerFullName || projectData.owner, ownerSystemRole, ownerDescriptiveRole)">
                <Avatar 
                    :image="ownerMemberId && !avatarFailed[ownerMemberId] ? `/project/member/${ownerMemberId}/avatar?t=${Date.now()}` : null"
                    :label="avatarFailed[ownerMemberId] || !ownerMemberId ? projectData.owner?.slice(0, 2).toUpperCase() : null"
                    size="medium" 
                    shape="circle" 
                    class="user-avatar"
                    @error="handleAvatarError(ownerMemberId, projectData.ownerFullName || projectData.owner)"
                />
                <div class="user-info">
                    <span class="user-fullname">{{ projectData.ownerFullName || projectData.owner }}</span>
                    <span class="user-system-role">({{ ownerSystemRole }})</span>
                    <span class="user-descriptive-role">{{ ownerDescriptiveRole || '' }}</span>
                </div>
            </div>
            <!-- Остальные участники -->
            <div v-for="user in participantsWithAvatarStatus" :key="user.member_id" class="user-item" @click="openRoleDialog(user.member_id, user.user.name, user.system_role, user.descriptive_role)">
                <Avatar 
                    :image="user.member_id && !avatarFailed[user.member_id] ? `/project/member/${user.member_id}/avatar?t=${Date.now()}` : null"
                    :label="avatarFailed[user.member_id] || !user.member_id ? user.user.username.slice(0, 2).toUpperCase() : null"
                    size="medium" 
                    shape="circle" 
                    class="user-avatar"
                    @error="handleAvatarError(user.member_id, user.user.name)"
                />
                <div class="user-info">
                    <span class="user-fullname">{{ user.user.name }} {{ user.user.surname }}</span>
                    <span class="user-system-role">({{ user.system_role }})</span>
                    <span class="user-descriptive-role">{{ user.descriptive_role || '' }}</span>
                </div>
            </div>
        </div>
        <div v-if="!projectData.others?.length && !projectData.owner" class="no-users">
            No users assigned
        </div>
        <div class="add-participant-container">
            <div v-if="showInvitationCode" class="invitation-code-label">
                <p>Invitation Code: <span class="code-value">{{ invitationCode }}</span></p>
                <p>Expires: <span class="code-value">{{ invitationExpiresAt }}</span></p>
                <Button label="Copy Code" icon="pi pi-copy" class="copy-button" @click="copyCode" />
            </div>
            <Button 
                label="Show connection code" 
                icon="pi pi-user-plus" 
                class="connection-code-button" 
                @click="fetchInvitationCode" 
            />
            <Button 
                label="New sprint" 
                class="new-sprint-button" 
                @click="showSprintForm" 
            />
        </div>
        <SetRoleDialog 
            :show="showRoleDialog" 
            :member-id="selectedMemberId" 
            :member-name="selectedMemberName" 
            :initial-system-role="selectedSystemRole" 
            :initial-descriptive-role="selectedDescriptiveRole" 
            @update:show="showRoleDialog = $event" 
            @roles-updated="updateRoles" 
        />
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import { createInvitationCode, getUserData } from '../services/api';
import { useToast } from 'primevue/usetoast';
import SetRoleDialog from './SetRoleDialog.vue';

const toast = useToast();

const props = defineProps({
    projectData: { type: Object, required: true },
    projectId: { type: Number, required: true },
});

const emit = defineEmits(['show-sprint-form']);

const showInvitationCode = ref(false);
const invitationCode = ref('');
const invitationExpiresAt = ref('');

// Храним состояние ошибок аватарок по member_id
const avatarFailed = ref({});

// Находим данные владельца
const ownerMemberId = computed(() => {
    const owner = props.projectData.others.find(user => user.system_role === 'OWNER');
    return owner ? owner.member_id : null;
});

const ownerSystemRole = computed(() => {
    const owner = props.projectData.others.find(user => user.system_role === 'OWNER');
    return owner ? owner.system_role : 'OWNER';
});

const ownerDescriptiveRole = computed(() => {
    const owner = props.projectData.others.find(user => user.system_role === 'OWNER');
    return owner ? owner.descriptive_role ?? '' : '';
});

// Список участников с состоянием аватарок
const participantsWithAvatarStatus = computed(() => {
    return props.projectData.others.map(user => ({
        ...user,
        avatarFailed: avatarFailed.value[user.member_id] || false,
    }));
});

// Получаем данные текущего пользователя
const currentUser = ref(null);
const fetchCurrentUser = async () => {
    try {
        const userData = await getUserData();
        currentUser.value = userData;
        console.log('Current user:', userData);
    } catch (error) {
        console.error('Failed to fetch current user:', error);
    }
};
fetchCurrentUser();

// Проверка прав текущего пользователя
const hasPermission = computed(() => {
    console.log('projectData.owner:', props.projectData.owner);
    console.log('projectData.others:', props.projectData.others);
    
    // Ищем пользователя в projectData.others по username из getUserData
    const userInProject = currentUser.value && props.projectData.others.find(
        user => user.user.username === currentUser.value.username
    );
    
    console.log('userInProject:', userInProject);
    
    // Если пользователь найден и его роль ADMIN или OWNER, разрешаем доступ
    if (userInProject && ['ADMIN', 'OWNER'].includes(userInProject.system_role)) {
        return true;
    }
    
    // Запасной вариант: если текущий username совпадает с projectData.owner
    if (currentUser.value && currentUser.value.username === props.projectData.owner) {
        return true;
    }
    
    return false;
});

// Управление диалоговым окном ролей
const showRoleDialog = ref(false);
const selectedMemberId = ref(0);
const selectedMemberName = ref('');
const selectedSystemRole = ref('MEMBER');
const selectedDescriptiveRole = ref('');

const openRoleDialog = (memberId, memberName, systemRole, descriptiveRole) => {
    console.log('Opening role dialog for member:', memberId, 'System role:', systemRole, 'Descriptive role:', descriptiveRole);
    console.log('projectData.others:', props.projectData.others);
    if (!hasPermission.value) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'You do not have permission to update roles',
            life: 3000,
        });
        return;
    }
    selectedMemberId.value = memberId;
    selectedMemberName.value = memberName;
    selectedSystemRole.value = systemRole || 'MEMBER';
    selectedDescriptiveRole.value = descriptiveRole ?? '';
    showRoleDialog.value = true;
};

const updateRoles = ({ memberId, systemRole, descriptiveRole }) => {
    const user = props.projectData.others.find(u => u.member_id === memberId);
    if (user) {
        user.system_role = systemRole;
        user.descriptive_role = descriptiveRole;
    }
};

// Обработка ошибки загрузки аватарки
const handleAvatarError = (member_id, name) => {
    if (member_id) {
        avatarFailed.value[member_id] = true;
    }
};

const fetchInvitationCode = async () => {
    try {
        const response = await createInvitationCode(props.projectId);
        invitationCode.value = response.code;
        invitationExpiresAt.value = new Date(response.expires_at).toLocaleString();
        showInvitationCode.value = true;
    } catch (error) {
        const status = error.response?.status;
        if (status === 403) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'You do not have permission to create an invitation code', life: 3000 });
        } else if (status === 404) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Project not found', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create invitation code', life: 3000 });
        }
    }
};

const copyCode = async () => {
    try {
        await navigator.clipboard.writeText(invitationCode.value);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Invitation code copied to clipboard', life: 3000 });
        showInvitationCode.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to copy code', life: 3000 });
    }
};

const showSprintForm = () => {
    emit('show-sprint-form');
};
</script>

<style scoped>
.users-info {
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

.participants-title {
    text-align: center;
    color: #1D5C57;
    font-size: 20px;
    margin: 0;
}

.no-users {
    text-align: center;
    color: #666;
    font-size: 14px;
    flex: 1;
}

.user-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
}

.user-item {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
}

.user-item:hover {
    background: #e0e0e0;
    border-radius: 8px;
}

.user-avatar {
    flex-shrink: 0;
}

.user-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-width: calc(100% - 60px); /* Учитываем ширину аватарки и gap */
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
    color: #1D5C57;
    word-break: break-word;
}

.add-participant-container {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.connection-code-button {
    background: #1F9D9B;
    border: none;
    width: 100%;
    color: white;
    font-size: 16px;
    padding: 10px;
    border-radius: 12px;
}

.connection-code-button:hover {
    background: #1D5C57;
}

.new-sprint-button {
    background: #1F9D9B;
    border: none;
    width: 100%;
    color: white;
    font-size: 16px;
    padding: 14px;
    border-radius: 12px;
}

.new-sprint-button:hover {
    background: #1D5C57;
}

.invitation-code-label {
    position: absolute;
    top: 0;
    left: 0;
    padding: 10px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 300px;
    width: 100%;
    z-index: 10;
}

.invitation-code-label p {
    margin: 0;
    font-size: 14px;
    color: #000;
}

.invitation-code-label .code-value {
    color: #1F9D9B;
}

.copy-button {
    background: #1D5C57;
    border: none;
    color: white;
    font-size: 14px;
    padding: 6px 12px;
    border-radius: 8px;
    width: fit-content;
    margin: 0 auto;
}

.copy-button:hover {
    background: #1A4A45;
}
</style>