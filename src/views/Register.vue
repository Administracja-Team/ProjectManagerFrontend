<!-- src/components/Register.vue -->
<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import 'primeicons/primeicons.css';
import { useToast } from 'primevue/usetoast';
import { registerUser } from '../services/api';

const router = useRouter();

// Стейт для полей ввода
const user_name = ref('');
const name = ref('');
const surname = ref('');
const email = ref('');
const password = ref('');
const repeat_password = ref('');
const language_code = ref('en');
// Поле avatar закомментировано, так как не используется
// const avatar = ref(null);

const toast = useToast();

// Ошибки для полей
const errors = ref({
  user_name: '',
  name: '',
  surname: '',
  email: '',
  password: '',
  repeat_password: '',
});

const handleRegister = async () => {
  // Сначала валидируем поля
  if (!validateFields()) {
    return;
  }

  try {
    const userData = {
      username: user_name.value,
      email: email.value,
      password: password.value,
      name: name.value,
      surname: surname.value,
      language_code: language_code.value,
    };
    const result = await registerUser(userData /*, avatar.value*/);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Registration successful! Redirecting to login...',
      life: 3000,
    });
    console.log('User registered:', result);
    setTimeout(() => {
      router.push('/');
    }, 3000); // Перенаправление после показа тоста
  } catch (error) {
    console.error('Registration error:', error);
    let message = 'Registration failed. Please try again.';
    if (error.response?.status === 409) {
      message = error.response.data?.message || 'Username or email already exists.';
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    }
    showToast(message);
  }
};

const showToast = (message, severity = 'error') => {
  toast.add({ severity, summary: severity === 'error' ? 'Error' : 'Success', detail: message, life: 3000 });
};

// Проверка email с использованием регулярного выражения
const validateEmail = (emailValue) => {
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailPattern.test(emailValue);
};

// Проверка на наличие цифр и специальных знаков в имени и фамилии
const validateName = (nameValue) => {
  const namePattern = /^[A-Za-zА-Яа-яЁё]+$/;
  return namePattern.test(nameValue);
};

// Проверка длины поля (минимум 2 символа)
const validateLength = (value, minLength = 2) => {
  return value.length >= minLength;
};

// Проверка пароля (минимум 8 символов, буквы, цифры, специальные символы)
const validatePasswordStrength = (passwordValue) => {
  const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordPattern.test(passwordValue);
};

// Валидация паролей (сравнение пароля и подтверждения)
const validatePassword = () => {
  return password.value === repeat_password.value;
};

// Валидация всех полей
const validateFields = () => {
  let isValid = true;

  // Проверяем каждое поле и обновляем ошибки
  if (!user_name.value || !validateLength(user_name.value)) {
    errors.value.user_name = 'Username is required and should be at least 2 characters';
    showToast(errors.value.user_name);
    isValid = false;
    setBorderRed('user_name');
    applyShake('user_name');
  } else {
    errors.value.user_name = '';
  }

  if (!name.value || !validateLength(name.value) || !validateName(name.value)) {
    errors.value.name = 'Name is required, should be at least 2 characters and contain only letters';
    showToast(errors.value.name);
    isValid = false;
    setBorderRed('name');
    applyShake('name');
  } else {
    errors.value.name = '';
  }

  if (!surname.value || !validateLength(surname.value) || !validateName(surname.value)) {
    errors.value.surname = 'Surname is required, should be at least 2 characters and contain only letters';
    showToast(errors.value.surname);
    isValid = false;
    setBorderRed('surname');
    applyShake('surname');
  } else {
    errors.value.surname = '';
  }

  if (!email.value || !validateLength(email.value) || !validateEmail(email.value)) {
    errors.value.email = 'Please enter a valid email';
    showToast(errors.value.email);
    isValid = false;
    setBorderRed('email');
    applyShake('email');
  } else {
    errors.value.email = '';
  }

  if (!password.value || !validateLength(password.value, 8) || !validatePasswordStrength(password.value)) {
    errors.value.password =
      'Password must be at least 8 characters long and include letters, numbers, and special characters';
    showToast(errors.value.password);
    isValid = false;
    setBorderRed('password');
    applyShake('password');
  } else {
    errors.value.password = '';
  }

  if (!repeat_password.value || !validateLength(repeat_password.value, 8)) {
    errors.value.repeat_password = 'Please repeat the password (at least 8 characters)';
    showToast(errors.value.repeat_password);
    isValid = false;
    setBorderRed('repeat_password');
    applyShake('repeat_password');
  } else if (!validatePassword()) {
    errors.value.repeat_password = 'Passwords do not match';
    showToast(errors.value.repeat_password);
    isValid = false;
    setBorderRed('repeat_password');
    applyShake('repeat_password');
  } else {
    errors.value.repeat_password = '';
  }

  return isValid;
};

// Функция для установки красной рамки на поле
const setBorderRed = (field) => {
  const inputField = document.getElementById(field);
  if (inputField) {
    inputField.style.borderColor = '#F08080';
    inputField.style.backgroundColor = '#FFEBEB';
    setTimeout(() => {
      inputField.style.borderColor = '';
      inputField.style.backgroundColor = '#FFFFFF';
    }, 500);
  }
};

// Функция для добавления анимации дергания
const applyShake = (field) => {
  const inputField = document.getElementById(field);
  if (inputField) {
    inputField.classList.add('shake-error');
    setTimeout(() => {
      inputField.classList.remove('shake-error');
    }, 500);
  }
};

// Переход на страницу логина
const goToLogin = () => {
  router.push('/');
};
</script>

<template>
  <div class="register-container">
    <div class="register-box">
      <div class="header">
        <Button icon="pi pi-arrow-left" class="back-button" size="large" rounded aria-label="Back" @click="goToLogin" />
        <h1>Sign Up</h1>
      </div>

      <form @submit.prevent="handleRegister">
        <InputText id="user_name" v-model="user_name" placeholder="User name" class="input-field" />
        <InputText id="name" v-model="name" placeholder="Name" class="input-field" />
        <InputText id="surname" v-model="surname" placeholder="Surname" class="input-field" />
        <InputText id="email" v-model="email" type="email" placeholder="Email" class="input-field" />
        <InputText id="password" v-model="password" type="password" placeholder="Password" class="input-field" />
        <InputText
          id="repeat_password"
          v-model="repeat_password"
          type="password"
          placeholder="Repeat password"
          class="input-field"
        />

        <Button label="Sign Up" type="submit" class="register-button" />

        <!-- Toast компонент для показа уведомлений -->
        <Toast />
      </form>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;700&display=swap');

.register-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #1d5c57;
}

.register-box {
  background: #1d5c57;
  border-radius: 50px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 400px;
  height: 620px;
  border: 5px solid #1f9d9b;
}

.header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.back-button {
  position: absolute;
  left: 0;
  background-color: #1d5c57;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.back-button:focus,
.back-button:active,
.back-button:hover {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

h1 {
  color: #f3efef;
  font-size: 32px;
  font-family: 'Source Sans 3', sans-serif;
}

.input-field {
  border-radius: 10px;
  width: 100%;
  margin-bottom: 1rem;
  font-size: 24px;
  font-weight: 600;
  font-family: 'Source Sans 3', sans-serif;
}

.register-button {
  color: #f3efef;
  font-family: 'Source Sans 3', sans-serif !important;
  font-size: 24px !important;
  width: 300px;
  margin-top: 20px;
}

@keyframes shake {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  50% {
    transform: translateX(5px);
  }
  75% {
    transform: translateX(-5px);
  }
  100% {
    transform: translateX(0);
  }
}

.shake-error {
  animation: shake 0.5s ease;
}
</style>