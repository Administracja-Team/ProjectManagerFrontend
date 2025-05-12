<!-- src/components/UsersInfo.vue -->
<template>
    <div class="users-info">
        <h3 class="participants-title">Participants</h3>
        <div class="user-list">
            <!-- Создатель -->
            <div class="user-item">
                <div class="user-content" @click="openRoleDialog(ownerMemberId, projectData.ownerFullName || projectData.owner, ownerSystemRole, ownerDescriptiveRole)">
                    <Skeleton v-if="isLoadingAvatars" class="user-avatar-skeleton" shape="circle" size="2.5rem" />
                    <Avatar v-else
                        :image="avatarUrls[ownerMemberId] || null"
                        :label="!avatarUrls[ownerMemberId] ? projectData.owner?.slice(0, 2).toUpperCase() : null"
                        size="medium" 
                        shape="circle" 
                        class="user-avatar"
                    />
                    <div class="user-info">
                        <span class="user-fullname">{{ projectData.ownerFullName || projectData.owner || 'Unknown' }}</span>
                        <span class="user-system-role">({{ ownerSystemRole }})</span>
                        <span class="user-descriptive-role">{{ ownerDescriptiveRole || '' }}</span>
                    </div>
                </div>
                <Button 
                    v-if="hasPermission && ownerMemberId" 
                    icon="pi pi-trash" 
                    class="delete-button" 
                    @click="confirmDelete(ownerMemberId, projectData.ownerFullName || projectData.owner)" 
                />
            </div>
            <!-- Остальные участники -->
            <div v-for="user in participantsWithAvatarStatus" :key="user.member_id" class="user-item">
                <div class="user-content" @click="openRoleDialog(user.member_id, user.user.name, user.system_role, user.descriptive_role)">
                    <Skeleton v-if="isLoadingAvatars" class="user-avatar-skeleton" shape="circle" size="2.5rem" />
                    <Avatar v-else
                        :image="avatarUrls[user.member_id] || null"
                        :label="!avatarUrls[user.member_id] ? user.user.username.slice(0, 2).toUpperCase() : null"
                        size="medium" 
                        shape="circle" 
                        class="user-avatar"
                    />
                    <div class="user-info">
                        <span class="user-fullname">{{ user.user.name }} {{ user.user.surname }}</span>
                        <span class="user-system-role">({{ user.system_role }})</span>
                        <span class="user-descriptive-role">{{ user.descriptive_role || '' }}</span>
                    </div>
                </div>
                <Button 
                    v-if="hasPermission" 
                    icon="pi pi-trash" 
                    class="delete-button" 
                    @click="confirmDelete(user.member_id, user.user.name)" 
                />
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
        <ConfirmDialog />
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';
import { createInvitationCode, getUserData, deleteMember, getMemberAvatar } from '../services/api';
import { useToast } from 'primevue/usetoast';
import SetRoleDialog from './SetRoleDialog.vue';

const toast = useToast();
const confirm = useConfirm();

const props = defineProps({
    projectData: { type: Object, required: true },
    projectId: { type: Number, required: true },
});

const emit = defineEmits(['show-sprint-form']);

const showInvitationCode = ref(false);
const invitationCode = ref('');
const invitationExpiresAt = ref('');

// Храним URL аватаров по member_id
const avatarUrls = ref({});
// Храним состояние ошибок аватарок по member_id
const avatarFailed = ref({});
// Храним общее состояние загрузки всех аватарок
const isLoadingAvatars = ref(false);

// Находим владельца
const ownerMember = computed(() => {
    return props.projectData.others.find(member => member.system_role === 'OWNER') || null;
});

const ownerMemberId = computed(() => {
    return ownerMember.value?.member_id || null;
});

const ownerSystemRole = computed(() => {
    return ownerMember.value?.system_role || 'OWNER';
});

const ownerDescriptiveRole = computed(() => {
    return ownerMember.value?.descriptive_role || '';
});

// Загрузка аватаров
const loadAvatars = async () => {
    isLoadingAvatars.value = true;
    // Очищаем старые аватары
    Object.values(avatarUrls.value).forEach(url => URL.revokeObjectURL(url));
    avatarUrls.value = {};
    avatarFailed.value = {};

    // Собираем всех участников, включая владельца
    const participants = props.projectData.others || [];

    // Создаём массив задач для параллельной загрузки аватаров
    const avatarPromises = participants
        .filter(user => user.member_id) // Пропускаем участников без member_id
        .map(async (user) => {
            // Проверяем, что member_id безопасен
            if (user.member_id > Number.MAX_SAFE_INTEGER) {
                console.warn(`UsersInfo - member_id ${user.member_id} exceeds Number.MAX_SAFE_INTEGER`);
                return { member_id: user.member_id, avatarUrl: null, error: new Error('Invalid member_id') };
            }
            try {
                const avatarUrl = await getMemberAvatar(user.member_id);
                return { member_id: user.member_id, avatarUrl, error: null };
            } catch (error) {
                console.error(`UsersInfo - Error fetching avatar for member ${user.member_id}:`, {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                return { member_id: user.member_id, avatarUrl: null, error };
            }
        });

    // Ждём завершения всех запросов
    const results = await Promise.all(avatarPromises);

    // Обрабатываем результаты
    results.forEach(({ member_id, avatarUrl, error }) => {
        if (avatarUrl) {
            avatarUrls.value[member_id] = avatarUrl;
        } else {
            avatarFailed.value[member_id] = true;
            console.warn(`UsersInfo - Failed to fetch avatar for member ${member_id}:`, error);
        }
    });

    // Проверяем владельца
    if (ownerMemberId.value && avatarFailed.value[ownerMemberId.value]) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Failed to load owner avatar',
            life: 3000
        });
    } else if (!ownerMemberId.value) {
        console.warn('UsersInfo - Owner not found in projectData.others');
        // Тост показываем только один раз
        if (!avatarUrls.value.hasWarnedOwnerNotFound) {
            toast.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Owner not found in project participants',
                life: 3000
            });
            avatarUrls.value.hasWarnedOwnerNotFound = true;
        }
    }

    isLoadingAvatars.value = false;
};

// Загружаем аватары при изменении projectData.others
watch(() => props.projectData.others, () => {
    loadAvatars();
}, { immediate: true, deep: true });

// Список участников с состоянием аватарок
const participantsWithAvatarStatus = computed(() => {
    return props.projectData.others.filter(user => user.system_role !== 'OWNER').map(user => ({
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
    } catch (error) {
        console.error('Failed to fetch current user:', error);
    }
};
fetchCurrentUser();

// Проверка прав текущего пользователя
const hasPermission = computed(() => {
    const userInProject = currentUser.value && props.projectData.others.find(
        user => user.user.username === currentUser.value.username
    );
    
    return userInProject && ['ADMIN', 'OWNER'].includes(userInProject.system_role) || 
           (currentUser.value && currentUser.value.username === props.projectData.owner);
});

// Управление диалоговым окном ролей
const showRoleDialog = ref(false);
const selectedMemberId = ref(0);
const selectedMemberName = ref('');
const selectedSystemRole = ref('MEMBER');
const selectedDescriptiveRole = ref('');

const openRoleDialog = (memberId, memberName, systemRole, descriptiveRole) => {
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

// Подтверждение удаления
const confirmDelete = (memberId, memberName) => {
    confirm.require({
        message: `Are you sure you want to remove the user ${memberName} from the project?`,
        header: 'Confirm Removal',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes',
        rejectLabel: 'No',
        accept: async () => {
            try {
                await deleteMember(memberId);
                props.projectData.others = props.projectData.others.filter(u => u.member_id !== memberId);
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Member removed successfully',
                    life: 3000,
                });
            } catch (error) {
                const status = error.response?.status;
                if (status === 403) {
                    toast.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'You do not have permission to remove members',
                        life: 3000,
                    });
                } else if (status === 404) {
                    toast.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Member not found',
                        life: 3000,
                    });
                } else if (status === 400) {
                    toast.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'You cannot remove yourself',
                        life: 3000,
                    });
                } else {
                    toast.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to remove member',
                        life: 3000,
                    });
                }
            }
        },
        reject: () => {
            // Ничего не делаем при отмене
        }
    });
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
    font-family: 'Source Sans 3', sans-serif;
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
    cursor: pointer;
}

.user-avatar, .user-avatar-skeleton {
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

.delete-button {
    background: transparent;
    border: none;
    color: #ff4d4f;
    font-size: 16px;
    padding: 4px;
    cursor: pointer;
}

.delete-button:hover {
    color: #cc0000;
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