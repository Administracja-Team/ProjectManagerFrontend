<!-- src/components/ProfileDialog.vue -->
<template>
    <Dialog v-model:visible="visible" header="Profile" :style="{ width: '30rem', height: dialogHeight }" :position="position" :modal="true" :draggable="false" class="profile-dialog">
        <div class="dialog-content">
            <div class="profile-header">
                <div class="avatar-container">
                    <Avatar :image="avatarImage" shape="circle" class="avatar" />
                    <Button icon="pi pi-camera" class="avatar-upload-button" text @click="triggerFileInput" />
                    <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/jfif" class="file-input" @change="handleFileChange" />
                </div>
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
import { getUserData, updateUserProfile, getUserAvatar, uploadUserAvatar } from '../services/api';

// Пропсы
const props = defineProps({
    position: { type: String, default: 'left' },
    show: { type: Boolean, default: false },
    initialName: { type: String, default: '' },
    initialSurname: { type: String, default: '' },
    initialUsername: { type: String, default: '' },
    initialEmail: { type: String, default: '' },
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
const avatarImage = ref(null);
const about = ref(props.initialAbout);
const isEditing = ref(false);
const fullName = ref(`${props.initialName} ${props.initialSurname}`);
const showPasswordDialog = ref(false);
const fileInput = ref(null);
const previewImage = ref(null);

// Инициализация Toast
const toast = useToast();

// Вычисляемая высота диалога
const dialogHeight = computed(() => `calc(100vh - 60px)`);

// Получение данных пользователя и аватара
const fetchUserData = async () => {
    try {
        const data = await getUserData();
        console.log('Dialog - Fetched user data:', data);
        name.value = data.name || '';
        surname.value = data.surname || '';
        username.value = data.username || '';
        email.value = data.email || '';
        about.value = data.description || '';
        fullName.value = `${data.name || ''} ${data.surname || ''}`.trim();

        try {
            avatarImage.value = await getUserAvatar();
            console.log('Dialog - Fetched avatar:', avatarImage.value);
        } catch (error) {
            avatarImage.value = null;
            console.warn('Dialog - No avatar available:', error);
        }
    } catch (error) {
        console.error('Dialog - Error fetching user data:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load profile data', life: 3000 });
    }
};

// Открытие выбора файла
const triggerFileInput = () => {
    fileInput.value.click();
};

// Обработка выбранного файла
const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Проверка формата
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/jfif'];
    if (!allowedTypes.includes(file.type)) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Only PNG, JPG, JPEG, WEBP, or JFIF files are allowed', life: 3000 });
        return;
    }

    // Предупреждение о серверных ограничениях
    const serverSupportedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!serverSupportedTypes.includes(file.type)) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Server only accepts PNG or JPG. You may encounter an error.', life: 4000 });
    }

    // Проверка размера (до 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'File size exceeds 5MB', life: 3000 });
        return;
    }

    // Предпросмотр
    previewImage.value = URL.createObjectURL(file);
    avatarImage.value = previewImage.value;

    // Загрузка на сервер
    try {
        await uploadUserAvatar(file);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Avatar updated successfully', life: 3000 });
        avatarImage.value = await getUserAvatar();
    } catch (error) {
        const status = error.response?.status;
        if (status === 417) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Only PNG or JPG files are accepted by the server', life: 3000 });
        } else if (status === 413) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'File too large', life: 3000 });
        } else if (status === 403) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Unauthorized to update avatar', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update avatar', life: 3000 });
        }
        avatarImage.value = await getUserAvatar().catch(() => null);
    } finally {
        fileInput.value.value = '';
        if (previewImage.value) {
            URL.revokeObjectURL(previewImage.value);
            previewImage.value = null;
        }
    }
};

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
            ...(about.value !== props.initialAbout && { description: about.value }),
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

.avatar-container {
    position: relative;
    display: flex;
    align-items: center;
}

.avatar {
    height: 150px;
    width: 150px;
    margin-right: 20px;
}

.avatar-upload-button {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: #1F9D9B;
    color: white;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-upload-button:hover {
    background: #1D5C57;
}

.file-input {
    display: none;
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
    color: #1F9D9B !important;
    border: 1px solid #1F9D9B;
}
</style>