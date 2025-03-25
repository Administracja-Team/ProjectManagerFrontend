<script setup>
import Button from 'primevue/button';
import { useRouter } from 'vue-router';

const router = useRouter();

const login_out = () => {
    localStorage.clear();
    router.push('/');
};
</script>
<template>
    <h1>Hello</h1>
    <Button label="Login-out" class="login-button" @click="login_out" />
</template>

<style scoped>
.login-button{
    width: 200px;
    height: 60px;
}
</style>