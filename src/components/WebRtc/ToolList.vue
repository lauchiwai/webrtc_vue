<template>
    <div class="bnt-div">
        <a-button @click="store.toggleAudio" class="bnt">
            <AudioMutedOutlined v-if="!store.streamOutput.audio" />
            <AudioOutlined v-else />
        </a-button>

        <a-button @click="store.toggleVideo" class="bnt">
            <EyeInvisibleOutlined v-if="!store.streamOutput.video" />
            <EyeOutlined v-else />
        </a-button>

        <a-button @click="store.isVideoSwitch = !store.isVideoSwitch" class="bnt">
            <RetweetOutlined />
        </a-button>

        <a-button @click="store.captureScreenshot" class="bnt" :disabled="!store.hasRemoteVideo">
            <PictureOutlined />
        </a-button>

        <a-dropdown placement="top" class="dropdown-div" :disabled="!store.hasRemoteVideo">
                <template #overlay>
                    <a-menu @click="" style="">
                        <a-button @click="isRecord = !isRecord" class="bnt dropdown-bnt">
                            <CaretRightOutlined v-if="!isRecord" />
                            <BorderOutlined v-if="isRecord" style="color: rgba(173, 20, 20, 0.8); font-weight: bold;" />
                        </a-button>
                    </a-menu>
                </template>
                <a-button class="bnt" :disabled="!store.hasRemoteVideo">
                    <VideoCameraOutlined v-if="!isRecord" />
                    <LoadingOutlined v-if="isRecord" style="color: rgba(145, 12, 12, 0.5);" />
                </a-button>
            </a-dropdown>
    </div> 
</template>

<script setup lang="ts">
import { useWebRTCStore } from '@/stores/webrtc'
import {
    AudioOutlined,
    AudioMutedOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    RetweetOutlined,
    CaretRightOutlined,
    BorderOutlined,
    ArrowDownOutlined,
    VideoCameraOutlined,
    LoadingOutlined,
    PictureOutlined
} from '@ant-design/icons-vue'
import { ref, watch } from 'vue'

const store = useWebRTCStore()
let isRecord = ref<boolean>(false);
let isDisableDownload = ref<boolean>(true);

watch(isRecord, (isRecord) => {
    isRecord ? store.startRecord() : store.stopRecord();
})
</script>

<style scoped>
.bnt {
    height: 40px;
    border-radius: 40%;
    margin: 0 5px;
    transition: background-color 0.2s;
    background-color: rgba(255, 255, 255, 0.9);
    border: 1px solid wheat;
}

.bnt:hover {
    background-color: white;
    border: 1px solid wheat;
    transform: scale(1.1);
    transition: transform 0.1s;
    box-shadow: 3px 3px 4px grey;
}

.bnt:active {
    transform: scale(0.95) translateY(5px);
    transition: transform 0.3s;
    background-color: #FFDCB9;
}

ul {
    background-color: transparent !important;
    box-shadow: none !important;
}

.dropdown-bnt {
    background-color: rgb(255, 254, 251);
    border: rgb(0, 0, 0, 0.5) solid 1px;
}
</style>