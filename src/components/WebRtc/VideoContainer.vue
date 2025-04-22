<template>
    <div class="video-box">
        <video 
            class="video-small" 
            ref="smallVideo" 
            autoplay
            :muted="!store.isVideoSwitch"
            :style="{ border: !store.isVideoSwitch ? '2px solid #00EC00' : 'none' }"
        >
        </video>

        <video 
            class="video-big" 
            ref="bigVideo" 
            autoplay
            :muted="store.isVideoSwitch"
            :style="{ border: store.isVideoSwitch ? '2px solid #00EC00' : 'none' }"
        >
        </video>

        <div class="tool-list-container">
            <ToolList />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useWebRTCStore } from '@/stores/webrtc'
import { ref, watchEffect, onMounted, onBeforeUnmount } from 'vue'

import ToolList from '@/components/WebRtc/ToolList.vue'

const store = useWebRTCStore()
const smallVideo = ref<HTMLVideoElement>()
const bigVideo = ref<HTMLVideoElement>()

onMounted(() => {
    if (bigVideo.value) {
        store.registerBigVideoElement(bigVideo.value)
    }
    if (smallVideo.value) {
        store.registerSmallVideoElement(smallVideo.value)
    }
})

onBeforeUnmount(() => {
    store.registerBigVideoElement(null)
    store.registerSmallVideoElement(null)
})

watchEffect(() => {
    if (smallVideo.value) {
        smallVideo.value.srcObject = store.smallVideoStream
    }
    if (bigVideo.value) {
        bigVideo.value.srcObject = store.bigVideoStream
    }
})
</script>

<style scoped>
.video-box {
    position: relative;
}

.tool-list-container{
    position: absolute;
    width: 100%;
    display: flex;
    justify-content: center;
    bottom: 5%;
}

video {
    height: 550px;
    width: 800px;
    border-radius: 5px;
    box-shadow: 2px 2px 2px grey;
}

.center-div {
    margin-top: 0;
    display: flex;
    justify-content: center;
}

.video-small{
    position: absolute;
}

.video-small {
    transform: scale(0.4) translate(70%, -70%);
    background-color: gray;
}

.video-big {
    background-color: gray;
    border:  10px solid black ;
}
</style>