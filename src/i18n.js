import { createI18n } from 'vue-i18n';

const messages = {
    en: {
        save: "Save",
        placeholder: "Enter text..."
    },
    ru: {
        save: "Сохранить",
        placeholder: "Введите текст..."
    }
};

const i18n = createI18n({
    legacy: false, // Современный API
    locale: localStorage.getItem('lang') || 'en', // Сохранение языка
    messages
});

export default i18n;
