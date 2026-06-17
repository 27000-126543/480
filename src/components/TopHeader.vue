<template>
  <div class="top-header">
    <div class="header-left">
      <div class="toggle-btn" @click="$emit('toggle-sidebar')">
        <el-icon :size="20">
          <Menu />
        </el-icon>
      </div>
      <div class="logo">
        <el-icon :size="24" color="#1890ff">
          <House />
        </el-icon>
        <span class="title">智慧中央厨房3D监管平台</span>
      </div>
    </div>

    <div class="header-center">
      <div class="stat-cards">
        <div class="stat-card">
          <span class="stat-label">今日产量</span>
          <span class="stat-value">8,526</span>
          <span class="stat-unit">份</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">运行工位</span>
          <span class="stat-value success">8</span>
          <span class="stat-unit">/11</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">待处理订单</span>
          <span class="stat-value warning">12</span>
          <span class="stat-unit">单</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">库存预警</span>
          <span class="stat-value danger">3</span>
          <span class="stat-unit">项</span>
        </div>
      </div>
    </div>

    <div class="header-right">
      <div class="time-display">
        <div class="current-time">{{ currentTime }}</div>
        <div class="current-date">{{ currentDate }}</div>
      </div>

      <el-badge :value="alertCount" :hidden="alertCount === 0" class="alert-btn">
        <el-button circle size="large" @click="$emit('toggle-alerts')">
          <el-icon :size="18"><Bell /></el-icon>
        </el-button>
      </el-badge>

      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="36" :icon="UserFilled" />
          <div class="user-detail">
            <span class="user-name">{{ user?.name }}</span>
            <span class="user-role" :style="{ color: roleColor }">{{ user?.roleName }}</span>
          </div>
          <el-icon :size="12" class="dropdown-icon">
            <ArrowDown />
          </el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>个人信息
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>系统设置
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  Menu, House, Bell, User, Setting, 
  SwitchButton, UserFilled, ArrowDown 
} from '@element-plus/icons-vue'

const props = defineProps({
  user: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['logout', 'toggle-sidebar', 'toggle-alerts'])

const currentTime = ref('')
const currentDate = ref('')
const alertCount = ref(3)
let timer = null

const roleColor = computed(() => {
  const colors = {
    operator: '#52c41a',
    quality: '#1890ff',
    manager: '#722ed1',
    director: '#eb2f96'
  }
  return colors[props.user?.role] || '#8c8c8c'
})

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  currentDate.value = now.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  })
}

function handleCommand(command) {
  if (command === 'logout') {
    emit('logout')
  }
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.top-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(180deg, rgba(16, 32, 60, 0.95) 0%, rgba(16, 32, 60, 0.8) 100%);
  border-bottom: 1px solid rgba(24, 144, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toggle-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  color: #8c8c8c;
  transition: all 0.3s;
}

.toggle-btn:hover {
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 10px rgba(24, 144, 255, 0.5);
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.stat-cards {
  display: flex;
  gap: 30px;
}

.stat-card {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: #8c8c8c;
}

.stat-label {
  font-size: 12px;
  color: #8c8c8c;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1890ff;
}

.stat-value.success {
  color: #52c41a;
}

.stat-value.warning {
  color: #faad14;
}

.stat-value.danger {
  color: #ff4d4f;
}

.stat-unit {
  font-size: 12px;
  color: #8c8c8c;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.time-display {
  text-align: right;
}

.current-time {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  font-family: 'Consolas', monospace;
}

.current-date {
  font-size: 12px;
  color: #8c8c8c;
}

.alert-btn {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.3s;
}

.user-info:hover {
  background: rgba(24, 144, 255, 0.1);
}

.user-detail {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.user-role {
  font-size: 12px;
  font-weight: 500;
}

.dropdown-icon {
  color: #8c8c8c;
}
</style>
