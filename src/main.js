import './assets/main.css'; // Подключаем глобальные стили

import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from "@primeuix/themes/aura";
import { definePreset } from '@primeuix/themes';
import App from "./App.vue";
import i18n from "./i18n";
import router from './router'; // Добавляем маршрутизацию
import ToastService from 'primevue/toastservice'; // Импортируем ToastService
import Toast from 'primevue/toast';
import ConfirmationService from 'primevue/confirmationservice'; 
import Vue3TouchEvents from 'vue3-touch-events';
import 'primeicons/primeicons.css';

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            500: '#1F9D9B' // Цвет кнопок
        },
        surface: {
            500: '#1D5C57' // Цвет фона страницы
        },
        colorSheme:{
            light:{
                formField:{
                    hoverBorderColor: "{primary.color}",
                },
            },
            dark: {
                formField:{
                    hoverBorderColor: "{primary.color}",
                }
            }
        }
    },
    components: {
        button: {
            label:{
                fontWeight: "800"
            },
         },
         dialog:{
            headerGap: "100px",
         }
    }
});

const app = createApp(App);
app.use(i18n);
app.use(PrimeVue, {
    theme: {
        preset: MyPreset,
        options:{
            darkModeSelector: ".my-app-dark"
        }
    },
});
app.use(router);
app.use(ToastService);
app.use(ConfirmationService);
app.use(Vue3TouchEvents, {
    swipeTolerance: 30 // Устанавливаем порог свайпа
});
app.component('Toast', Toast);
app.mount("#app");
