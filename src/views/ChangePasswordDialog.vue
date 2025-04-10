<!-- src/components/ChangePasswordDialog.vue -->
<template>
    <Dialog v-model:visible="visible" :style="{ width: '25rem', height: 'auto' }" position="left" :modal="true" :draggable="false" class="change-password-dialog">
        <div class="dialog-content">
            <!-- Кнопка "Назад" -->
 

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
});
watch(visible, (newVal) => {
    emit('update:show', newVal);
});

// Закрытие диалога
const closeDialog = () => {
    visible.value = false;
};

// Применение изменений пароля
const applyPasswordChange = () => {
    visible.value = false; // Закрываем диалог после применения
};
</script>

<style scoped>
.change-password-dialog {
    background: #f0f0f0; /* Соответствует основному диалогу */
    border-radius: 10px;
}

.dialog-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    position: relative;
}

.back-button {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 30px;
    height: 30px;
    padding: 0;
}

.title {
    font-size: 20px;
    font-weight: bold;
    color: #1D5C57; /* Цвет как у надписей в основном диалоге */
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
    background: #1F9D9B; /* Цвет кнопки в тон текста "Change Password" */
    border: none;
    padding: 10px 20px;
    color: white;
    font-size: 16px;
}

.apply-button:hover {
    background: #24b4ac; /* Чуть светлее при наведении */
}
</style>