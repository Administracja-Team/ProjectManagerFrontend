<!-- src/components/ProfileDialog.vue -->
<template>
    <Dialog v-model:visible="visible" header="Profile" :style="{ width: '30rem', height: dialogHeight }" :position="position" :modal="true" :draggable="false" class="profile-dialog">
        <div class="dialog-content">
            <div class="profile-header">
                <Avatar :label="avatar || 'IH'" :image="avatarImage" shape="circle" class="avatar" />
                <div class="profile-info">
                    <div class="info-item">
                        <span class="info-label">Name</span>
                        <InputText v-if="isEditing" v-model="fullName" class="profile-field-input" />
                        <span v-else class="profile-field">{{ name }} {{ surname }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Username</span>
                        <InputText v-if="isEditing" v-model="username" class="profile-field-input" />
                        <span v-else class="profile-field">{{ username }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email</span>
                        <InputText v-if="isEditing" v-model="email" class="profile-field-input" />
                        <span v-else class="profile-field">{{ email }}</span>
                    </div>
                </div>
                <Button icon="pi pi-pencil" class="edit-button" text @click="toggleEdit" />
            </div>

            <div class="about-section">
                <h3 class="about-label">About</h3>
                <InputText v-if="isEditing" v-model="about" class="about-input" placeholder="Tell something about yourself" />
                <p v-else>{{ about || 'No information provided.' }}</p>
            </div>

            <div class="footer">
                <Button label="Change Password" class="change-password-button" @click="showChangePasswordDialog" />
            </div>
        </div>

        <ChangePasswordDialog :show="showPasswordDialog" @update:show="showPasswordDialog = $event" />
        <!-- Компонент Toast для уведомлений -->
        <Toast />
    </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Toast from 'primevue/toast';
import ChangePasswordDialog from './ChangePasswordDialog.vue';
import { getUserData, updateUserProfile } from '../services/api';

// Пропсы
const props = defineProps({
    position: { type: String, default: 'left' },
    show: { type: Boolean, default: false },
    initialName: { type: String, default: '' },
    initialSurname: { type: String, default: '' },
    initialUsername: { type: String, default: '' },
    initialEmail: { type: String, default: '' },
    initialAvatar: { type: String, default: '' },
    initialAbout: { type: String, default: '' },
});

// Эмиты
const emit = defineEmits(['update:show', 'save']);

// Данные
const visible = ref(props.show);
const name = ref(props.initialName);
const surname = ref(props.initialSurname);
const username = ref(props.initialUsername);
const email = ref(props.initialEmail);
const avatar = ref(props.initialAvatar);
const about = ref(props.initialAbout);
const isEditing = ref(false);
const fullName = ref(`${props.initialName} ${props.initialSurname}`);
const showPasswordDialog = ref(false);

// Инициализация Toast
const toast = useToast();

// Функция для получения данных о пользователе
const fetchUserData = async () => {
    try {
        const data = await getUserData();
        console.log('Dialog - Fetched user data:', data);
        name.value = data.name || '';
        surname.value = data.surname || '';
        username.value = data.username || '';
        email.value = data.email || '';
        avatar.value = data.avatar || 'IH';
        about.value = data.description || '',
        fullName.value = `${data.name || ''} ${data.surname || ''}`.trim();
        console.log('Dialog - Updated data:', { name: name.value, surname: surname.value, username: username.value, email: email.value, about: about.value });
    } catch (error) {
        console.error('Dialog - Error fetching user data:', error);
    }
};

// Если avatar — это URL-изображение
const avatarImage = computed(() => {
    return avatar.value && avatar.value.startsWith('http') ? avatar.value : null;
});

// Вычисляемая высота диалога
const dialogHeight = computed(() => `calc(100vh - 60px)`);

// Синхронизация видимости и загрузка данных при открытии
watch(() => props.show, async (newVal) => {
    visible.value = newVal;
    if (newVal) {
        await fetchUserData();
    }
});
watch(visible, (newVal) => {
    emit('update:show', newVal);
});

// Переключение режима редактирования с обновлением на сервере
const toggleEdit = async () => {
    if (isEditing.value) {
        const [newName, ...newSurnameParts] = fullName.value.split(' ');
        name.value = newName || '';
        surname.value = newSurnameParts.join(' ') || '';

        const updatedData = {
            ...(name.value !== props.initialName && { name: name.value }),
            ...(surname.value !== props.initialSurname && { surname: surname.value }),
            ...(username.value !== props.initialUsername && { username: username.value }),
            ...(email.value !== props.initialEmail && { email: email.value }),
            ...(about.value !== props.initialAbout && {description : about.value}),
        };

        try {
            if (Object.keys(updatedData).length > 0) {
                await updateUserProfile(updatedData);
                toast.add({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully', life: 3000 });
            } else {
                toast.add({ severity: 'info', summary: 'Info', detail: 'No changes to update', life: 3000 });
            }
            emit('save', { 
                name: name.value, 
                surname: surname.value, 
                username: username.value, 
                email: email.value, 
                avatar: avatar.value, 
                about: about.value 
            });
        } catch (error) {
            if (error.response?.status === 409) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Email or username already exists', life: 3000 });
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile', life: 3000 });
            }
        }
    } else {
        fullName.value = `${name.value} ${surname.value}`.trim();
    }
    isEditing.value = !isEditing.value;
};

// Открытие диалога смены пароля
const showChangePasswordDialog = () => {
    showPasswordDialog.value = true;
};
</script>

<style scoped>
.profile-dialog {
    margin: 0;
    padding: 0;
    background: #f0f0f0;
}

.dialog-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.profile-header {
    display: flex;
    align-items: center;
    background: white;
    border-radius: 15px;
    padding: 20px;
    position: relative;
    min-height: 200px;
    margin-bottom: 20px;
}

.avatar {
    height: 150px;
    width: 150px;
    margin-right: 20px;
}

.profile-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: center;
    text-align: center;
}

.info-item {
    margin-bottom: 15px;
}

.info-label {
    display: block;
    font-size: 14px;
    font-weight: bold;
    color: #1D5C57;
    margin-bottom: 5px;
}

.profile-field {
    font-size: 16px;
    color: #333;
}

.profile-field-input {
    width: 100%;
    font-size: 16px;
    text-align: center;
}

.edit-button {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 30px;
    height: 30px;
    padding: 0;
}

.about-section {
    text-align: center;
    padding: 20px;
    flex: 1;
}

.about-label {
    margin: 0 0 10px 0;
    font-size: 16px;
    font-weight: bold;
    color: #1D5C57;
}

.about-input {
    width: 100%;
    height: 100px;
    resize: vertical;
    margin-top: 10px;
}

p {
    margin: 0;
    color: #666;
}

.footer {
    text-align: center;
    padding-bottom: 20px;
}

.change-password-button {
    background: none;
    border: none;
    color: #1F9D9B;
    font-size: 16px;
    padding: 10px 0;
    cursor: pointer;
    transition: border 0.3s;
}

.change-password-button:hover {
    background: none !important;
    background-color: none !important;
    color: #1F9D9B !important;
    border: 1px solid #1F9D9B;
}
</style>