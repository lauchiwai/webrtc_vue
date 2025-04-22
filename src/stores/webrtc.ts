import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'

import io from 'socket.io-client'

type MediaDeviceType = 'audioinput' | 'videoinput'

export const useWebRTCStore = defineStore('webrtc', () => {
    // State
    let peerConn: RTCPeerConnection | null = null

    const room = ref('')
    const hasJoinedRoom = ref(false)
    const mediaStream = ref<MediaStream | null>(null)
    const remoteStream = ref<MediaStream | null>(null)
    const isVideoSwitch = ref(false)
    const streamOutput = ref({ audio: true, video: true })
    const audioOptions = ref<MediaDeviceInfo[]>([])
    const videoOptions = ref<MediaDeviceInfo[]>([])
    const selectedAudio = ref<MediaDeviceInfo>()
    const selectedVideo = ref<MediaDeviceInfo>()
    const socket = io('http://localhost:8080')

    const isRecording = ref(false)
    const recordTime = ref(0)
    const recordTimer = ref<NodeJS.Timeout | null>(null)
    const isDisableDownload = ref(true)

    // 媒体录制
    const mediaRecorder = ref<MediaRecorder | null>(null)
    const recordBuffer = ref<Blob[]>([])
    const supportedMimeTypes = ref<string[]>([])

    // element 
    const bigVideoRef = ref<HTMLVideoElement | null>(null)
    const registerBigVideoElement = (el: HTMLVideoElement | null) => {
        bigVideoRef.value = el
    }

    const smallVideoRef = ref<HTMLVideoElement | null>(null)
    const registerSmallVideoElement = (el: HTMLVideoElement | null) => {
        smallVideoRef.value = el
    }

    // Getters
    const hasRemoteVideo = computed(() => !!remoteStream.value)
    const smallVideoStream = computed(() =>
        isVideoSwitch.value ? remoteStream.value : mediaStream.value
    )
    const bigVideoStream = computed(() =>
        isVideoSwitch.value ? mediaStream.value : remoteStream.value
    )

    async function initMediaStream(constraints: MediaStreamConstraints) {
        try {
            mediaStream.value = await navigator.mediaDevices.getUserMedia(constraints)
            await getDevices()
        } catch (error) {
            console.error('Error getting media stream:', error)
            throw error
        }
    }

    async function getDevices() {
        const devices = await navigator.mediaDevices.enumerateDevices()
        audioOptions.value = devices.filter(d => d.kind === 'audioinput')
        videoOptions.value = devices.filter(d => d.kind === 'videoinput')

        if (audioOptions.value.length > 0) {
            selectedAudio.value = audioOptions.value[0]; // 假设只有一个音频轨道
        }

        if (videoOptions.value.length > 0) {
            selectedVideo.value = videoOptions.value[0]; // 假设只有一个音频轨道
        }
    }

    function toggleAudio() {
        streamOutput.value.audio = !streamOutput.value.audio
        mediaStream.value?.getAudioTracks().forEach(t => t.enabled = streamOutput.value.audio)
    }

    function toggleVideo() {
        streamOutput.value.video = !streamOutput.value.video
        mediaStream.value?.getVideoTracks().forEach(t => t.enabled = streamOutput.value.video)
    }

    async function switchDevice(kind: MediaDeviceType, deviceId: string) {
        const constraints: MediaStreamConstraints = {
            audio: kind === 'audioinput' ? { deviceId } : undefined,
            video: kind === 'videoinput' ? { deviceId } : undefined
        }

        const newStream = await navigator.mediaDevices.getUserMedia(constraints)
        mediaStream.value?.getTracks().forEach(t => t.stop())
        mediaStream.value = newStream
    }

    async function initPeerConnection() {
        const configuration = {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302', },],
        }

        peerConn = new RTCPeerConnection(configuration);

        if (mediaStream.value) {
            if (mediaStream.value.getVideoTracks().length == 0) {
                peerConn.addTransceiver('video', { direction: 'recvonly' })
            }

            if (mediaStream.value.getAudioTracks().length == 0) {
                peerConn.addTransceiver('audio', { direction: 'recvonly' })
            }

            mediaStream.value.getTracks().forEach((track) => {
                if (peerConn && mediaStream.value) {
                    peerConn.addTrack(track, mediaStream.value)
                    console.log(track)
                }
            })
        }

        peerConn.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('發送 ICE');
                socket.emit('ice_candidate', room.value, {
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate,
                })
            }
        }

        peerConn.oniceconnectionstatechange = (event) => {
            if (event && peerConn?.iceConnectionState === 'disconnected') {
                remoteStream.value = null;
            }
        }

        peerConn.ontrack = gotRemoteStream;
    }

    function gotRemoteStream(event: RTCTrackEvent) {
        remoteStream.value = event.streams[0];
    };

    async function sendSDP(isOffer: boolean) {
        try {
            if (!peerConn) {
                console.log('尚未開啟視訊')
                return
            }

            if (peerConn) {
                const localSDP = await peerConn[isOffer ? 'createOffer' : 'createAnswer']({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true,
                })

                // 設定本地SDP信令
                await peerConn.setLocalDescription(localSDP)

                // 寄出SDP信令
                let event = isOffer ? 'offer' : 'answer'
                socket.emit(event, room.value, peerConn.localDescription)
            }

        } catch (err) {
            throw err
        }
    }

    function setupSocketListeners() {
        socket.on('ready', async (msg) => {
            await sendSDP(true)
        })

        socket.on('leaved', (room, id) => {
            reset();
        })

        socket.on('bye', (room, id) => {
            hasJoinedRoom.value = !hasJoinedRoom.value
            message.error('對方已離開房間');
            reset();
        })

        socket.on('offer', async (desc) => {
            console.log('收到 offer, 設定對方的配置, 並建立 answer 發送到對端');
            if (peerConn) {
                await peerConn.setRemoteDescription(desc)
            }

            await sendSDP(false)
        })

        socket.on('answer', async (desc) => {
            console.log('收到 answer, 設定對方的配置');
            if (peerConn) {
                await peerConn.setRemoteDescription(desc)
            }
        })

        socket.on('ice_candidate', async (data) => {
            console.log('加入新取得的 ICE candidate');
            const candidate = new RTCIceCandidate({
                sdpMLineIndex: data.label,
                candidate: data.candidate,
            })

            if (peerConn) {
                await peerConn.addIceCandidate(candidate)
            }
        })
    }

    // reset
    const reset = () => {
        if (peerConn) {
            peerConn.close()
            peerConn = null
        }

        remoteStream.value = null;
    }

    const join = async () => {
        if (room.value.trim() == '') {
            message.error(' 請輸入 room Number ')
            return
        }

        await initPeerConnection()
        try {
            socket.emit('join', room.value);
            hasJoinedRoom.value = !hasJoinedRoom.value;
        } catch (e) {
            console.error("請求加入失敗")
        }
    }

    const leave = async () => {
        if (socket) {
            socket.emit('leave', room.value)
        }

        hasJoinedRoom.value = !hasJoinedRoom.value;
        reset();
        message.warning('離開房間')
    }

    const initSupportedFormats = () => {
        const possibleTypes = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm;codecs=h264',
            'video/mp4;codecs=h264',
        ]
        supportedMimeTypes.value = possibleTypes.filter(t =>
            MediaRecorder.isTypeSupported(t)
        )
    }

    const startRecord = async () => {
        try {
            if (!remoteStream.value) {
                throw new Error('未檢測到影像')
            }

            if (supportedMimeTypes.value.length === 0) {
                initSupportedFormats()
            }

            const options = {
                mimeType: supportedMimeTypes.value[0] || 'video/webm'
            }

            mediaRecorder.value = new MediaRecorder(remoteStream.value, options)

            mediaRecorder.value.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordBuffer.value.push(event.data)
                }
            }

            mediaRecorder.value.onstop = () => {
                downRecord()
                resetRecording()
            }

            mediaRecorder.value.start(1000)
            isRecording.value = true
            startTimer()

        } catch (error) {
            handleRecordingError(error)
        }
    }

    const stopRecord = () => {
        if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
            mediaRecorder.value.stop()
            isRecording.value = false
            stopTimer()
        }
    }

    const downRecord = () => {
        try {
            const blob = new Blob(recordBuffer.value, {
                type: mediaRecorder.value?.mimeType
            })

            const url = URL.createObjectURL(blob)
            downloadFile(url, `recording_${Date.now()}.${getFileExtension()}`)

            message.success('保存成功')
        } catch (error) {
            handleRecordingError(error)
        }
    }

    const getFileExtension = () => {
        const mime = mediaRecorder.value?.mimeType.split(';')[0]
        return mime?.split('/')[1] || 'webm'
    }

    const downloadFile = (url: string, filename: string) => {
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const startTimer = () => {
        recordTime.value = 0
        recordTimer.value = setInterval(() => {
            recordTime.value++
        }, 1000)
    }

    const stopTimer = () => {
        if (recordTimer.value) {
            clearInterval(recordTimer.value)
            recordTimer.value = null
        }
    }

    const resetRecording = () => {
        recordBuffer.value = []
        mediaRecorder.value = null
    }

    const handleRecordingError = (error: unknown) => {
        const msg = error instanceof Error ? error.message : '未知錯誤'
        message.error(`操作失敗: ${msg}`)
        console.error('Recording Error:', error)
        resetRecording()
    }

    const captureScreenshot = () => {
        let video = isVideoSwitch.value ? smallVideoRef.value : bigVideoRef.value
        if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
            console.error("尚未加載完成")
            message.error('尚未加載完成')
            return null
        }

        try {
            const w = video.videoWidth
            const h = video.videoHeight

            const canvas = document.createElement('canvas');
            if (canvas) {
                canvas.width = w
                canvas.height = h
                canvas.getContext('2d')?.drawImage(video, 0, 0, w, h)

                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/jpeg');;
                a.download = 'captured_frame.jpg';
                a.click()
                a.remove()
            }
        } catch (error) {
            message.error('截圖失敗')
            console.error('截圖錯誤: ', error)
            return null
        }
    }

    return {
        room,
        hasJoinedRoom,
        mediaStream,
        remoteStream,
        isVideoSwitch,
        streamOutput,
        audioOptions,
        videoOptions,
        selectedAudio,
        selectedVideo,
        isRecording,
        isDisableDownload,
        hasRemoteVideo,
        smallVideoStream,
        bigVideoStream,
        socket,

        initMediaStream,
        toggleAudio,
        toggleVideo,
        switchDevice,
        initPeerConnection,
        join,
        leave,
        setupSocketListeners,
        startRecord,
        stopRecord,
        downRecord,
        registerSmallVideoElement,
        registerBigVideoElement,
        captureScreenshot
    }
})