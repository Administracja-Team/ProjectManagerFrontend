<!-- src/components/SetRoleDialog.vue -->
<template>
    <Dialog 
        v-model:visible="visible" 
        :style="{ width: '24vw', height: '32vh' }" 
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
                <div v-if="props.initialSystemRole === 'OWNER'" class="system-role-static">
                    Owner
                </div>
                <Dropdown 
                    v-else
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
        // Не пытаемся менять systemRole для OWNER
        if (props.initialSystemRole !== 'OWNER') {
            await setSystemRole(props.memberId, roleToSet);
        }
        await setDescriptiveRole(props.memberId, descriptiveRole.value || '');
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Roles updated for ${props.memberName}`,
            life: 3000,
        });
        emit('roles-updated', {
            memberId: props.memberId,
            systemRole: props.initialSystemRole === 'OWNER' ? 'OWNER' : roleToSet,
            descriptiveRole: descriptiveRole.value,
        });
        closeDialog();
    } catch (error) {
        const status = error.response?.status;
        console.error('Error setting roles:', error.response?.data || error);
        let message = 'Failed to update roles';
        if (status === 403) {
            message = 'You do not have permission to update roles';
        } else if (status === 404) {
            message = 'Member not found';
        } else if (status === 400) {
            message = error.response?.data?.message || 'Invalid role data provided';
        } else if (status === 500) {
            message = 'Server error, please try again later';
        }
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: message,
            life: 3000,
        });
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
@import url('https://fonts.googleapis.com/css2?family=Source+Sans+3&display=swap');

.set-role-dialog {
    background: #ffffff;
    border-radius: 10px;
    padding: 0;
    margin: 0;
    z-index: 1000;
    font-family: 'Source Sans 3', sans-serif;
}

:deep(.p-dialog) {
    padding: 0 !important;
    margin: 0 !important;
    font-family: 'Source Sans 3', sans-serif;
}

:deep(.p-dialog-content) {
    padding: 0 !important;
    background: #ffffff;
    border-radius: 10px;
    overflow: hidden;
    font-family: 'Source Sans 3', sans-serif;
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
    font-family: 'Source Sans 3', sans-serif;
}

.close-button {
    position: absolute;
    top: 10px;
    left: 10px;
    background: transparent;
    border: none;
    color: #1D5C57;
    font-size: 18px;
    font-family: 'Source Sans 3', sans-serif;
}

.role-title {
    font-size: 20px;
    color: #1D5C57;
    margin: 0;
    text-align: center;
    font-family: 'Source Sans 3', sans-serif;
}

.role-headers {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-family: 'Source Sans 3', sans-serif;
}

.system-role-header,
.descriptive-role-header {
    font-size: 16px;
    color: #1D5C57;
    margin: 0;
    flex: 1;
    text-align: center;
    font-family: 'Source Sans 3', sans-serif;
}

.role-fields {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 10px;
    font-family: 'Source Sans 3', sans-serif;
}

.system-role-dropdown,
.descriptive-role-input,
.system-role-static {
    width: 48%;
    font-size: 14px;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ccc;
    box-sizing: border-box;
    font-family: 'Source Sans 3', sans-serif;
    height: 38px; /* Фиксированная высота для единообразия */
    display: flex;
    align-items: center;
}

.system-role-static {
    background: #f0f0f0;
    color: #1D5C57;
    font-weight: bold;
    justify-content: center; /* Центрируем текст Owner */
}

:deep(.p-dropdown) {
    height: 38px; /* Устанавливаем высоту для Dropdown */
    display: flex;
    align-items: center;
}

:deep(.p-inputtext) {
    height: 38px; /* Устанавливаем высоту для InputText */
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
    font-family: 'Source Sans 3', sans-serif;
}

.set-button:hover {
    background: #1A4A45;
}
</style>