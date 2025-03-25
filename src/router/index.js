import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue'; // Подключаем страницу входа
import Register from '../views/Register.vue'; // Проверь, что файл действительно здесь
import Home from '../views/HomePage.vue';

const routes = [
    { path: '/', component: Login }, // Главная страница — это страница входа
    { path: '/register', component: Register }, // Новый маршрут
    {path: '/home', component: Home}
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
