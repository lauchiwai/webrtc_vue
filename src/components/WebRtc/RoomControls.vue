<template>
    <div class="room-container-div">
        <a-input 
            v-model:value="store.room" 
            placeholder="room number" 
            style="width: 110px; margin: 0 10px;"
            :disabled="store.hasJoinedRoom"
        />
        <a-button 
            @click="store.join" 
            style="margin: 0 5px;" 
            :disabled="store.hasJoinedRoom"
        >
            <span> Join </span>
        </a-button>
        <a-button 
            @click="store.leave" 
            danger 
            style="margin: 0 5px;" 
            :disabled="!store.hasJoinedRoom"
        >
            <span> Leave </span>
        </a-button>
    </div>
  </template>
  
<script setup lang="ts">
import { useWebRTCStore } from '@/stores/webrtc'
    
const store = useWebRTCStore()
</script>

<style scoped>
.room-container-div {
    margin-top: 0;
    display: flex;
    justify-content: center;
}
</style>