# WebRTC Video Call Frontend Application

A real-time video communication solution based on Vue3 and WebRTC technology.

## Main Features

### 🎥 Real-time Communication

- Room number join mechanism
- Bidirectional audio and video stream transmission
- ICE candidate automatic negotiation
- Real-time connection status monitoring

### 🎛 Device Management

- Real-time audio input device switching
- Independent audio and video track control
- Automatic device list detection and updates

### ⏺ Media Processing

- Real-time remote screen recording
- Support for multiple video format outputs
- Real-time call screen capture
- Recording timer and automatic saving

## Technical Architecture

| Technology Area     | Solution               |
| ------------------- | ---------------------- |
| Frontend Framework  | Vue3 + TypeScript      |
| State Management    | Pinia                  |
| WebRTC Wrapper      | Native API             |
| Signaling Transport | Socket.io-client       |
| UI Component Library| Ant Design Vue         |

## Environment Requirements

- Modern browser (recommended Chrome 90+)
- Node.js v16+
- npm 8+

## Quick Start

### 1. Install Dependencies

```bash
npm install
npm run dev
