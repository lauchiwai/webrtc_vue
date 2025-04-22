<template>
    <div class="center-div">
        <a-select 
            v-model:value="store.selectedAudio" 
            style="width: 200px; margin: 0 10px;"
            @change="(v: string) => store.switchDevice('audioinput', v)"
        >
            <a-select-option 
                v-for="device in store.audioOptions" 
                :key="device.deviceId" 
                :value="device.deviceId"
            >
                {{ device.label || `Audio ${device.deviceId.slice(0, 5)}` }}
            </a-select-option>
        </a-select>
    
        <a-select 
            v-model:value="store.selectedVideo" 
            style="width: 200px; margin: 0 10px;"
            @change="(v: string) => store.switchDevice('videoinput', v)"
        >
            <a-select-option 
                v-for="device in store.videoOptions" 
                :key="device.deviceId" 
                :value="device.deviceId"
            >
                {{ device.label || `Video ${device.deviceId.slice(0, 5)}` }}
            </a-select-option>
        </a-select>
    </div>
</template>
  
<script setup lang="ts">
import { useWebRTCStore } from '@/stores/webrtc'

const store = useWebRTCStore()
</script>