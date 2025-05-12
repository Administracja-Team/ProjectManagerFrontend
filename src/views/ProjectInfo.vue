<!-- src/components/ProjectInfo.vue -->
<script setup>
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Card from 'primevue/card';
import Button from 'primevue/button';

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    }
});

defineEmits(['update:show']);

// Ссылка на элемент видео
const videoRef = ref(null);

// Функция для открытия видео в полноэкранном режиме
const enterFullscreen = () => {
    const video = videoRef.value;
    if (!video) return;

    try {
        if (video.requestFullscreen) {
            video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) { // Safari
            video.webkitRequestFullscreen();
        } else if (video.mozRequestFullScreen) { // Firefox
            video.mozRequestFullScreen();
        } else if (video.msRequestFullscreen) { // IE/Edge
            video.msRequestFullscreen();
        } else {
            console.warn('Fullscreen API is not supported by this browser.');
        }
    } catch (error) {
        console.error('Error entering fullscreen:', error);
    }
};

// Отслеживаем изменение props.show
watch(() => props.show, (newValue) => {
    if (newValue) {
        console.log('Dialog opened, attempting to enter fullscreen');
        enterFullscreen();
    }
});
</script>

<template>
    <Dialog 
        :visible="show" 
        header="Rickrolled :)" 
        :modal="true" 
        :style="{ width: '80vw', height: '80vw' }"
        class="rickroll-dialog"
        @update:visible="$emit('update:show', $event)"
    >
        <Card class="video-card">
            <template #content>
                <video 
                    ref="videoRef"
                    width="100%" 
                    height="400" 
                    autoplay 
                    loop
                    controls
                    src="@/assets/promo.mp4">
                    Your browser does not support the video tag.
                </video>
            </template>
        </Card>
        <template #footer>
            <Button label="Close" class="back-button" @click="$emit('update:show', false)" />
        </template>
    </Dialog>
</template>

<style scoped>
.rickroll-dialog .p-dialog-header {
    background: #1D5C57;
    color: white;
    padding: 10px;
}

.rickroll-dialog .p-dialog-content {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.video-card {
    width: 100%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.video-card video {
    display: block;
    width: 100%;
    height: auto;
    max-height: 400px;
    object-fit: contain;
}

.back-button {
    background: #1F9D9B;
    border: none;
    color: white;
    font-size: 16px;
    padding: 10px 20px;
    border-radius: 20px;
    transition: background 0.3s;
}

.back-button:hover {
    background: #24b4ac;
}
</style>