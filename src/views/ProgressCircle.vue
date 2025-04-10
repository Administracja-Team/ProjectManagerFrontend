<!-- ProgressCircle.vue -->
<template>
    <div class="progress-circle">
      <svg width="50" height="50" viewBox="0 0 100 100">
        <!-- Фоновая окружность -->
        <circle cx="50" cy="50" r="45" stroke="#e0e0e0" stroke-width="8" fill="none" />
        <!-- Прогресс -->
        <circle cx="50" cy="50" r="45" stroke="#03FF64" stroke-width="8" fill="none"
          :stroke-dasharray="circumference" :stroke-dashoffset="progressOffset" />
      </svg>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  
  // Определяем props
  const props = defineProps({
    progress: {
      type: Number,
      default: 0,
    },
  });
  
  const circumference = computed(() => 2 * Math.PI * 45); // Длина окружности радиуса 45
  const progressOffset = computed(() => circumference.value * (1 - props.progress / 100));
  </script>
  
  <style scoped>
  .progress-circle circle {
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
  }
  </style>