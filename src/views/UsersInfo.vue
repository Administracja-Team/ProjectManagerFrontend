<!-- src/components/UsersInfo.vue -->
<template>
    <div class="users-info">
        <h3 class="participants-title">Participants</h3>
        <div class="user-list">
            <!-- Создатель -->
            <div class="user-item">
                <Avatar 
                    :label="projectData.owner?.slice(0, 2).toUpperCase()" 
                    size="medium" 
                    shape="circle" 
                />
                <span class="user-name">{{ projectData.ownerFullName || projectData.owner }} (Owner)</span>
            </div>
            <!-- Остальные участники -->
            <div v-for="user in projectData.others" :key="user.member_id" class="user-item">
                <Avatar 
                    :label="user.user.username.slice(0, 2).toUpperCase()" 
                    size="medium" 
                    shape="circle" 
                />
                <span class="user-name">{{ user.user.name }} {{ user.user.surname }}</span>
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
    </div>
</template>

<script setup>
import { ref } from 'vue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import { createInvitationCode } from '../services/api';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const props = defineProps({
    projectData: { type: Object, required: true },
    projectId: { type: Number, required: true },
});

const emit = defineEmits(['show-sprint-form']);

const showInvitationCode = ref(false);
const invitationCode = ref('');
const invitationExpiresAt = ref('');

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
    border-top-right-radius: 10px; /* Закругление правого верхнего угла */
    border-bottom-right-radius: 10px; /* Закругление правого нижнего угла */
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
}

.user-name {
    font-size: 14px;
    color: #1D5C57;
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