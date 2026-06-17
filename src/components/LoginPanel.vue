<template>
  <div class="login-container">
    <div class="login-bg">
      <div class="bg-particles">
        <div v-for="i in 20" :key="i" class="particle" :style="particleStyle(i)"></div>
      </div>
    </div>
    
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <el-icon :size="40" color="#1890ff">
            <House />
          </el-icon>
        </div>
        <h1 class="title">智慧中央厨房</h1>
        <p class="subtitle">3D可视化运营调度与食品安全监管平台</p>
      </div>

      <el-tabs v-model="loginType" class="login-tabs">
        <el-tab-pane label="账号登录" name="password">
          <el-form :model="loginForm" class="login-form" @submit.prevent="handlePasswordLogin">
            <el-form-item>
              <el-input 
                v-model="loginForm.username" 
                placeholder="请输入用户名"
                size="large"
                :prefix-icon="User"
              />
            </el-form-item>
            <el-form-item>
              <el-input 
                v-model="loginForm.password" 
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                @keyup.enter="handlePasswordLogin"
              />
            </el-form-item>
            <el-button 
              type="primary" 
              size="large" 
              class="login-btn"
              :loading="loggingIn"
              @click="handlePasswordLogin"
            >
              登 录
            </el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="人脸识别" name="face">
          <div class="face-login">
            <div class="face-scanner" :class="{ 'scanning': faceScanning, 'success': faceSuccess, 'failed': faceFailed }">
              <div class="scan-frame">
                <div class="frame-corner top-left"></div>
                <div class="frame-corner top-right"></div>
                <div class="frame-corner bottom-left"></div>
                <div class="frame-corner bottom-right"></div>
                <div class="scan-line" v-if="faceScanning"></div>
              </div>
              <div class="face-icon">
                <el-icon :size="80">
                  <UserFilled v-if="!faceSuccess && !faceFailed" />
                  <CircleCheck v-else-if="faceSuccess" class="success-icon" />
                  <CircleClose v-else class="failed-icon" />
                </el-icon>
              </div>
            </div>
            
            <p class="face-status">{{ faceStatusText }}</p>
            
            <el-button 
              type="primary" 
              size="large" 
              class="face-login-btn"
              :loading="faceScanning"
              :disabled="faceSuccess"
              @click="handleFaceLogin"
            >
              {{ faceScanning ? '识别中...' : faceSuccess ? '识别成功' : '开始人脸识别' }}
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div class="quick-login">
        <p>快速登录（演示）：</p>
        <div class="quick-btns">
          <el-button size="small" type="success" @click="quickLogin('operator1')">操作员</el-button>
          <el-button size="small" type="primary" @click="quickLogin('quality1')">品控</el-button>
          <el-button size="small" type="warning" @click="quickLogin('manager1')">经理</el-button>
          <el-button size="small" type="danger" @click="quickLogin('director1')">总监</el-button>
        </div>
      </div>

      <div class="login-footer">
        <p>© 2024 智慧中央厨房管理系统</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock, House, UserFilled, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { authManager } from '../managers/AuthManager.js'

const emit = defineEmits(['login-success'])

const loginType = ref('password')
const loginForm = ref({
  username: '',
  password: ''
})
const loggingIn = ref(false)
const faceScanning = ref(false)
const faceSuccess = ref(false)
const faceFailed = ref(false)

const faceStatusText = computed(() => {
  if (faceSuccess.value) return '人脸识别成功，正在登录...'
  if (faceFailed.value) return '人脸识别失败，请重试'
  if (faceScanning.value) return '正在识别中，请稍候...'
  return '将面部对准摄像头进行识别'
})

function particleStyle(index) {
  return {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${10 + Math.random() * 10}s`
  }
}

function handlePasswordLogin() {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loggingIn.value = true
  setTimeout(() => {
    const result = authManager.login(loginForm.value.username, loginForm.value.password)
    loggingIn.value = false
    
    if (result.success) {
      emit('login-success', result.user)
    } else {
      ElMessage.error(result.message)
    }
  }, 500)
}

async function handleFaceLogin() {
  faceScanning.value = true
  faceSuccess.value = false
  faceFailed.value = false

  const faceData = 'face_data_director1'
  
  try {
    const result = await authManager.faceLogin(faceData)
    faceScanning.value = false
    
    if (result.success) {
      faceSuccess.value = true
      setTimeout(() => {
        emit('login-success', result.user)
      }, 1000)
    } else {
      faceFailed.value = true
      ElMessage.error(result.message)
      setTimeout(() => {
        faceFailed.value = false
      }, 2000)
    }
  } catch (error) {
    faceScanning.value = false
    faceFailed.value = true
    ElMessage.error('人脸识别出错')
  }
}

function quickLogin(username) {
  loginForm.value.username = username
  loginForm.value.password = '123456'
  loginType.value = 'password'
  handlePasswordLogin()
}
</script>

<style scoped>
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  background: linear-gradient(135deg, #0a1628 0%, #1a3a5c 50%, #0d2137 100%);
}

.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.bg-particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(24, 144, 255, 0.6);
  border-radius: 50%;
  animation: float 15s infinite ease-in-out;
  box-shadow: 0 0 10px rgba(24, 144, 255, 0.8);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-50px) translateX(30px);
    opacity: 1;
  }
}

.login-card {
  position: relative;
  width: 420px;
  padding: 40px;
  background: rgba(16, 32, 60, 0.95);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(24, 144, 255, 0.1);
  z-index: 10;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(24, 144, 255, 0.4);
}

.title {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 10px rgba(24, 144, 255, 0.5);
}

.subtitle {
  font-size: 14px;
  color: #8c8c8c;
  margin: 0;
}

.login-tabs {
  margin-bottom: 20px;
}

.login-tabs :deep(.el-tabs__item) {
  color: #8c8c8c;
  font-size: 16px;
}

.login-tabs :deep(.el-tabs__item.is-active) {
  color: #1890ff;
}

.login-tabs :deep(.el-tabs__active-bar) {
  background: #1890ff;
}

.login-form {
  margin-top: 20px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 10px;
  background: linear-gradient(90deg, #1890ff, #096dd9);
  border: none;
  box-shadow: 0 4px 15px rgba(24, 144, 255, 0.4);
}

.login-btn:hover {
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.6);
}

.face-login {
  text-align: center;
  padding: 20px 0;
}

.face-scanner {
  width: 200px;
  height: 200px;
  margin: 0 auto 20px;
  position: relative;
  border-radius: 50%;
  background: rgba(24, 144, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.face-scanner.scanning {
  box-shadow: 0 0 30px rgba(24, 144, 255, 0.6);
}

.face-scanner.success {
  background: rgba(82, 196, 26, 0.2);
  box-shadow: 0 0 30px rgba(82, 196, 26, 0.6);
}

.face-scanner.failed {
  background: rgba(255, 77, 79, 0.2);
  box-shadow: 0 0 30px rgba(255, 77, 79, 0.6);
}

.scan-frame {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border: 2px solid transparent;
}

.frame-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: #1890ff;
  border-style: solid;
  border-width: 0;
}

.frame-corner.top-left {
  top: 0;
  left: 0;
  border-top-width: 3px;
  border-left-width: 3px;
}

.frame-corner.top-right {
  top: 0;
  right: 0;
  border-top-width: 3px;
  border-right-width: 3px;
}

.frame-corner.bottom-left {
  bottom: 0;
  left: 0;
  border-bottom-width: 3px;
  border-left-width: 3px;
}

.frame-corner.bottom-right {
  bottom: 0;
  right: 0;
  border-bottom-width: 3px;
  border-right-width: 3px;
}

.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #1890ff, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

.face-icon {
  color: #8c8c8c;
}

.success-icon {
  color: #52c41a;
}

.failed-icon {
  color: #ff4d4f;
}

.face-status {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 20px;
}

.face-login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(90deg, #52c41a, #389e0d);
  border: none;
  box-shadow: 0 4px 15px rgba(82, 196, 26, 0.4);
}

.quick-login {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.quick-login p {
  font-size: 12px;
  color: #8c8c8c;
  margin: 0 0 10px 0;
}

.quick-btns {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
}

.login-footer p {
  font-size: 12px;
  color: #595959;
  margin: 0;
}
</style>
