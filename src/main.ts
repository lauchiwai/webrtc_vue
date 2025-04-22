import 'ant-design-vue/dist/reset.css';

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue';

const app = createApp(App)
app.use(createPinia()).use(Antd).use(router).mount('#app');