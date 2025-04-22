<template>
    <div class="container">
        <div class="room-control-container">
            <RoomControl />
        </div>
        <div class="video-container">
            <VideoContainer />
        </div>

        <div class="device-selector-container">
            <DeviceSelector />
        </div>
    </div>
</template>
  
<script setup lang="ts">
import { onMounted } from 'vue'
import { useWebRTCStore } from '@/stores/webrtc'

import RoomControl from '@/components/WebRtc/RoomControls.vue'
import VideoContainer from '@/components/WebRtc/VideoContainer.vue'
import DeviceSelector from '@/components/WebRtc/DeviceSelector.vue'
const store = useWebRTCStore()

onMounted(async () => {
    try {
        await store.initMediaStream({ audio: true, video: true })
        store.setupSocketListeners()
    } catch (error) {
        console.error('Initialization error:', error)
    }
})
</script>
  
<style scoped>
.container{
    height: 100vh;
    width: 100vw;
    background-color: #E8E8E8;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}

.room-control-container{
    padding: 15px;
}

.video-container{
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 2%;
}

.device-selector-container{
    padding: 15px;
}
</style>