<template>
    <div class="layout">
        <!-- Верхняя панель -->
        <div class="topbar">
            <div class="profile">
                <!-- Используем данные из userData -->
                <Avatar :label="userData.avatar" shape="circle" class="avatar" />
                <span class="username">{{ userData.name }}</span>
            </div>
            <div class="icons">
                <i class="pi pi-globe"></i>
                <i class="pi pi-moon"></i>
            </div>
        </div>

        <div class="main-content">
            <!-- Боковое меню -->
            <div class="sidebar">
                <h3>Menu</h3>
                <Button label="Projects" icon="pi pi-folder" class="menu-button" @click="gotoHome" />
            </div>

            <div class="profile-container">
                <Avatar :label="userData.avatar" shape="circle" class="big-avatar" />

                <div class="info-section">
                    <!-- Используем данные из userData -->
                    <div class="info-grid">
                        <div class="info-block">
                            <span class="label">Name</span>
                            <span class="value">{{ userData.name }}</span>
                        </div>
                        <div class="info-block">
                            <span class="label">Username</span>
                            <span class="value">{{ userData.username }}</span>
                        </div>
                        <div class="info-block">
                            <span class="label">Email</span>
                            <span class="value">{{ userData.email }}</span>
                        </div>
                    </div>

                    <!-- Горизонтальная линия (перед About) -->
                    <div class="horizontal-line"></div>

                    <!-- About -->
                    <div class="about-section">
                        <h3>About</h3>
                        <p>Short description about the user...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import { getUserData } from '../services/api'; // Импортируем функцию для получения данных

// Переменные для хранения данных о пользователе
const userData = ref({
    name: '',
    surname: '',
    username: '',
    email: '',
    avatar: '',
});

// Функция для получения данных о пользователе
const fetchUserData = async () => {
    try {
        const data = await getUserData(); // Запрашиваем данные о пользователе
        userData.value = {
            name: data.name,
            surname: data.surname,
            username: data.username,
            email: data.email,
            avatar: data.avatar || 'IH', // Если нет аватара, используем "IH"
        };
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
};

// Вызовем fetchUserData при монтировании компонента
onMounted(fetchUserData);

const router = useRouter();

const gotoHome = () => {
    router.push('/home');
};
</script>

<style scoped>
/* Основная разметка */
.layout {
    display: flex;
    flex-direction: column;
    font-family: 'Source Sans 3', sans-serif;
}

/* Верхняя панель */
.topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #1D5C57;
    color: white;
    padding: 10px 20px;
}

.account-text {
    font-size: 14px;
}

.profile {
    display: flex;
    align-items: center;
}

.avatar {
    width: 40px;
    height: 40px;
    background: #bbb;
    margin-right: 10px;
}

.username {
    font-size: 16px;
    font-weight: bold;
}

.icons i {
    font-size: 18px;
    margin-left: 15px;
    cursor: pointer;
}

/* Основной контент */
.main-content {
    display: flex;
    padding: 20px;
}

/* Меню */
.sidebar {
    width: 200px;
    padding: 0;
}

.sidebar h3 {
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 2px solid #1D5C57;
    display: block;
    text-align: left;
}

.menu-button {
    margin-top: 10px;
    background: none;
    border: none;
    color: #1D5C57;
    font-size: 16px;
}

/* Профиль */
.profile-container {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    margin-top: 20px;
    margin-left: 50px;
    position: relative;
}

.big-avatar {
    width: 200px;
    height: 200px;
    background: #bbb;
    flex-shrink: 0;
    margin-top: -10px;
}

.info-section {
    margin-left: 50px;
    display: flex;
    flex-direction: column;
    width: 100%;
}

.info-grid {
    display: flex;
    gap: 30px;
    width: 100%;
    justify-content: space-between;
    margin-top: 50px;
    position: relative;
    /* Для вертикальных полос и горизонтальной линии */
}

/* Вертикальные полосы между блоками, опущены ниже */
.info-block:not(:last-child)::after {
    content: '';
    position: absolute;
    width: 1px;
    height: 133%;
    background: #1D5C57;
    right: -15px;
    top: 70%;
    transform: translateY(-50%);
}

/* Каждый info-block должен быть позиционирован относительно */
.info-block {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-left: 30px;
    position: relative;
}

.label {
    margin-top: 50px;
    font-size: 32px;
    color: #1D5C57;
    font-weight: bold;
}

.value {
    font-size: 28px;
    font-weight: normal;
}

/* Горизонтальная полоса между профилем и About */
.horizontal-line {
    width: calc(100% - 50px);
    /* Ширина линии, минус отступы */
    height: 1px;
    background: #1D5C57;
    margin-top: 20px;
    /* Отступ сверху, чтобы линия не сливалась с блоками */
    margin-bottom: 30px;
    /* Отступ снизу, чтобы линия не сливалась с About */
}

/* About */
.about-section {
    margin-top: 60px;
    font-size: 18px;
    color: #333;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.about-section h3 {
    font-size: 28px;
    color: #1D5C57;
}

.about-section p {
    max-width: 600px;
    margin: 10px 0;
    font-size: 18px;
    text-align: center;
    line-height: 1.5;
}
</style>