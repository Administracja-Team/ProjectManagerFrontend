<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import { useToast } from 'primevue/usetoast';
import { loginUser } from '../services/api'; // Импортируем функцию loginUser
import { onMounted } from 'vue';


const router = useRouter();
const toast = useToast();

// Поля для ввода
const email = ref('');
const password = ref('');
const rememberMe = ref(false);

// Ошибки для полей
const errors = ref({
  email: '',
  password: ''
});

// Функция для отображения тоста с ошибкой
const showToast = (message) => {
  toast.add({ severity: 'error', summary: 'Error', detail: message, life: 3000, icon: 'pi pi-times-circle', styleClass: 'custom-toast-error'});
};

// Функция для установки красной рамки и анимации тряски
const setFieldError = (field) => {
  const inputField = document.getElementById(field);
  if (inputField) {
    inputField.style.borderColor = '#F08080';
    inputField.style.backgroundColor = '#FFEBEB';
    inputField.classList.add('shake-error');

    setTimeout(() => {
      inputField.style.borderColor = '';
      inputField.style.backgroundColor = '#FFFFFF';
      inputField.classList.remove('shake-error');
    }, 500);
  }
};

// Валидация полей
const validateFields = () => {
  let isValid = true;

  if (!email.value) {
    errors.value.email = 'Email is required';
    showToast(errors.value.email);
    setFieldError('email');
    isValid = false;
  } else {
    errors.value.email = '';
  }

  if (!password.value) {
    errors.value.password = 'Password is required';
    showToast(errors.value.password);
    setFieldError('password');
    isValid = false;
  } else {
    errors.value.password = '';
  }

  return isValid;
};

// Обработчик входа
const login = async () => {
  if (validateFields()) {
    console.log('Logging in...');
    
    try {
      const response = await loginUser(email.value, password.value);
      
      // Успешный логин
      console.log('Login successful:', response);
      // Сохраняем токен в localStorage, если логин успешен
      localStorage.setItem('access_token', response.token);

      // Сохраняем токены и данные в localStorage
      if (rememberMe.value) {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        localStorage.setItem('expires_at', response.expires_at);
      }

      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('expires_at', response.expires_at);

      // Перенаправляем пользователя на главную страницу или другую
      router.push('/home');
      
    } catch (error) {
      console.error('Login failed:', error);
      showToast('Login failed. Please check your credentials.');
    }
  } else {
    console.log('Validation failed');
  }
};

onMounted(() => {
  // Проверяем, есть ли сохраненные токены
  const accessToken = localStorage.getItem('access_token');
  const expiresAt = localStorage.getItem('expires_at');
  const refreshToken = localStorage.getItem('refresh_token');

  if (accessToken && expiresAt && refreshToken) {
    // Получаем текущую дату и время в UTC
    const currentDateUTC = new Date(Date.now());

    // Преобразуем expires_at в объект Date в формате UTC
    const expirationDateUTC = new Date(expiresAt + 'Z'); // Добавляем 'Z' для UTC

    // Сравниваем дату истечения с текущей
    if (expirationDateUTC > currentDateUTC) {
      // Если токен еще действителен
      console.log('Access allowed ' + expirationDateUTC + " > " + currentDateUTC);
      router.push('/home');
    } else {
      // Если токен истек
      console.log('Token expired');
    }
  } else {
    // Если нет токенов в localStorage
    console.log('No tokens found');
  }
});

</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <h1>Sign in</h1>
      <InputText v-model="email" placeholder="Name or Email" class="input-field" />
      <InputText v-model="password" type="password" placeholder="Password" class="input-field" />
      
      <div class="remember-me">
        <Checkbox v-model="rememberMe" inputId="remember" binary />
        <label for="remember">Remember me</label>
      </div>

      <Button label="Login" class="login-button" @click="login" />
      <Button label="Register" class="register-button" @click="$router.push('/register')" />

      <Toast />
    </div>
  </div>
</template>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;700&display=swap');

.login-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #1D5C57;
}

.login-box {
  background: #1D5C57;
  border-radius: 50px;
  padding: 2rem;
  padding-left: 2rem;
  padding-right: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 400px;
  height: 460px;
  border: 5px solid #1F9D9B;
}

h1{
  color: #F3EFEF;
  font-size: 32px;
  font-family: 'Source Sans Pro', sans-serif;
}

.input-field {
  border-radius: 10px;
  width: 100%;
  margin-bottom: 1rem;
  font-size: 24px;
  font-weight: 600;
  font-family: 'Source Sans Pro', sans-serif;
}

.remember-me {
  display: flex;
  align-items: center;
}

.remember-me label {
  margin-left: 8px;
  font-weight: 600;
  font-size: 18px;
  color: #FFFFFF;
  font-family: 'Source Sans Pro', sans-serif;
}

.login-button{
  color: #F3EFEF;
  font-family: 'Source Sans Pro', sans-serif !important;
  font-size: 24px !important;
  width: 300px;
  margin-top: 20px;
}

.register-button{
  color: #F3EFEF;
  font-family: 'Source Sans Pro', sans-serif !important;
  width: 300px;
  margin-top: 20px;
  font-size: 24px !important;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
}

.shake-error {
  animation: shake 0.5s ease;
}
</style>
