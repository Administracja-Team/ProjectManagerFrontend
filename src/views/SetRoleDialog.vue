<!-- src/components/SetRoleDialog.vue -->
<template>
    <Dialog 
        v-model:visible="visible" 
        :style="{ width: '24vw', height: '35vh' }" 
        :modal="true" 
        :draggable="false" 
        :show-header="false" 
        position="center" 
        class="set-role-dialog"
    >
        <div class="role-form-container">
            <Button 
                icon="pi pi-arrow-left" 
                class="close-button" 
                @click="closeDialog" 
            />
            <h3 class="role-title">Set role</h3>
            <div class="role-headers">
                <h4 class="system-role-header">System role</h4>
                <h4 class="descriptive-role-header">Descriptive role</h4>
            </div>
            <div class="role-fields">
                <Dropdown 
                    v-model="systemRole" 
                    :options="systemRoleOptions" 
                    option-label="label" 
                    option-value="value" 
                    class="system-role-dropdown" 
                    placeholder="Select system role" 
                />
                <InputText 
                    v-model="descriptiveRole" 
                    class="descriptive-role-input" 
                    placeholder="Enter descriptive role" 
                />
            </div>
            <Button 
                label="Set" 
                class="set-button" 
                @click="setRoles" 
            />
        </div>
    </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { setSystemRole, setDescriptiveRole } from '../services/api';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const props = defineProps({
    show: { type: Boolean, default: false },
    memberId: { type: Number, required: true },
    memberName: { type: String, required: true },
    initialSystemRole: { type: String, default: 'MEMBER' },
    initialDescriptiveRole: { type: String, default: '' },
});

const emit = defineEmits(['update:show', 'roles-updated']);

const visible = ref(props.show);
const systemRole = ref(props.initialSystemRole || 'MEMBER');
const descriptiveRole = ref(props.initialDescriptiveRole || '');

const systemRoleOptions = [
    { label: 'Member', value: 'MEMBER' },
    { label: 'Admin', value: 'ADMIN' },
];

const setRoles = async () => {
    const roleToSet = systemRole.value || 'MEMBER';
    if (!props.memberId || props.memberId <= 0) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Invalid member ID',
            life: 3000,
        });
        return;
    }
    console.log('Setting roles for member:', props.memberId, 'System role:', roleToSet, 'Descriptive role:', descriptiveRole.value);
    console.log('Request body for system role:', { payload: roleToSet });
    console.log('Request body for descriptive role:', { payload: descriptiveRole.value || '' });
    try {
        // Установка system_role
        await setSystemRole(props.memberId, roleToSet);
        // Установка descriptive_role
        await setDescriptiveRole(props.memberId, descriptiveRole.value || '');
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Roles updated for ${props.memberName}`,
            life: 3000,
        });
        emit('roles-updated', {
            memberId: props.memberId,
            systemRole: roleToSet,
            descriptiveRole: descriptiveRole.value,
        });
        closeDialog();
    } catch (error) {
        const status = error.response?.status;
        console.error('Error setting roles:', error.response?.data || error);
        if (status === 403) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'You do not have permission to update roles',
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
                detail: 'Invalid role data provided',
                life: 3000,
            });
        } else if (status === 500) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Server error, please try again later',
                life: 3000,
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to update roles',
                life: 3000,
            });
        }
    }
};

const closeDialog = () => {
    visible.value = false;
    emit('update:show', false);
    resetForm();
};

const resetForm = () => {
    systemRole.value = props.initialSystemRole || 'MEMBER';
    descriptiveRole.value = props.initialDescriptiveRole || '';
};

watch(() => props.show, (newVal) => {
    visible.value = newVal;
    if (!newVal) resetForm();
    else {
        systemRole.value = props.initialSystemRole || 'MEMBER';
        descriptiveRole.value = props.initialDescriptiveRole || '';
    }
});
</script>

<style scoped>
.set-role-dialog {
    background: #ffffff;
    border-radius: 10px;
    padding: 0;
    margin: 0;
    z-index: 1000;
}

:deep(.p-dialog) {
    padding: 0 !important;
    margin: 0 !important;
}

:deep(.p-dialog-content) {
    padding: 0 !important;
    background: #ffffff;
    border-radius: 10px;
    overflow: hidden;
}

.role-form-container {
    flex: 1;
    padding: 20px;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 15px;
    box-sizing: border-box;
    height: 100%;
    overflow-y: auto;
}

.close-button {
    position: absolute;
    top: 10px;
    left: 10px;
    background: transparent;
    border: none;
    color: #1D5C57;
    font-size: 18px;
}

.role-title {
    font-size: 20px;
    color: #1D5C57;
    margin: 0;
    text-align: center;
}

.role-headers {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}

.system-role-header,
.descriptive-role-header {
    font-size: 16px;
    color: #1D5C57;
    margin: 0;
    flex: 1;
    text-align: center;
}

.role-fields {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 10px;
}

.system-role-dropdown,
.descriptive-role-input {
    width: 48%;
    font-size: 14px;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ccc;
    box-sizing: border-box;
}

.set-button {
    background: #1D5C57;
    border: none;
    color: white;
    font-size: 16px;
    padding: 10px;
    border-radius: 12px;
    margin-top: auto;
    text-align: center;
}

.set-button:hover {
    background: #1A4A45;
}
</style>