<!-- src/components/ChangePasswordDialog.vue -->
<template>
    <Dialog v-model:visible="visible" :style="{ width: '25rem', height: 'auto' }" position="left" :modal="true" :draggable="false" class="change-password-dialog">
        <div class="dialog-content">
            <!-- Заголовок -->
            <h2 class="title">Change Password</h2>

            <!-- Поля ввода -->
            <div class="input-group">
                <span class="input-label">Current Password</span>
                <InputText v-model="currentPassword" type="password" class="input-field" />
            </div>
            <div class="input-group">
                <span class="input-label">New Password</span>
                <InputText v-model="newPassword" type="password" class="input-field" />
            </div>
            <div class="input-group">
                <span class="input-label">Repeat Password</span>
                <InputText v-model="repeatPassword" type="password" class="input-field" />
            </div>

            <!-- Кнопка Apply -->
            <Button label="Apply" class="apply-button" @click="applyPasswordChange" />
        </div>
    </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { updateUserPassword } from '../services/api';

const toast = useToast();

// Пропсы
const props = defineProps({
    show: { type: Boolean, default: false },
});

// Эмиты
const emit = defineEmits(['update:show']);

// Данные
const visible = ref(props.show);
const currentPassword = ref('');
const newPassword = ref('');
const repeatPassword = ref('');

// Синхронизация видимости
watch(() => props.show, (newVal) => {
    visible.value = newVal;
    if (!newVal) {
        // Очистка полей при закрытии
        currentPassword.value = '';
        newPassword.value = '';
        repeatPassword.value = '';
    }
});
watch(visible, (newVal) => {
    emit('update:show', newVal);
});

// Применение изменений пароля
const applyPasswordChange = async () => {
    // Валидация
    if (!currentPassword.value || !newPassword.value || !repeatPassword.value) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'All fields are required',
            life: 3000
        });
        return;
    }

    if (newPassword.value !== repeatPassword.value) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'New password and repeat password do not match',
            life: 3000
        });
        return;
    }

    try {
        await updateUserPassword(currentPassword.value, newPassword.value);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Password changed successfully',
            life: 3000
        });
        visible.value = false; // Закрываем диалог
    } catch (error) {
        const status = error.response?.status;
        if (status === 403) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Incorrect current password',
                life: 3000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to change password',
                life: 3000
            });
        }
    }
};
</script>

<style scoped>
.change-password-dialog {
    background: #f0f0f0;
    border-radius: 10px;
}

.dialog-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    position: relative;
}

.title {
    font-size: 20px;
    font-weight: bold;
    color: #1D5C57;
    margin: 0 0 20px 0;
    text-align: center;
}

.input-group {
    width: 100%;
    margin-bottom: 15px;
}

.input-label {
    display: block;
    font-size: 14px;
    font-weight: bold;
    color: #1D5C57;
    margin-bottom: 5px;
    text-align: left;
}

.input-field {
    width: 100%;
    font-size: 16px;
}

.apply-button {
    margin-top: 20px;
    background: #1F9D9B;
    border: none;
    padding: 10px 20px;
    color: white;
    font-size: 16px;
}

.apply-button:hover {
    background: #24b4ac;
}
</style>