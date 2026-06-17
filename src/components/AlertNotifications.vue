<template>
  <div class="alert-notifications">
    <transition-group name="alert">
      <div 
        v-for="alert in alerts" 
        :key="alert.id || alert.type"
        class="alert-item"
        :class="alert.level || 'warning'"
      >
        <div class="alert-icon">
          <el-icon :size="20">
            <Warning v-if="alert.level === 'danger'" />
            <InfoFilled v-else />
          </el-icon>
        </div>
        <div class="alert-content">
          <span class="alert-title">{{ alert.message }}</span>
          <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
        </div>
        <el-button 
          type="text" 
          size="small" 
          class="close-btn"
          @click="dismissAlert(alert)"
        >
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
    </transition-group>

    <div v-if="alerts.length > 0" class="alert-summary" @click="showDetail = !showDetail">
      <el-badge :value="alerts.length" class="alert-badge">
        <el-button type="warning" :icon="Bell">
          预警通知 ({{ alerts.length }})
        </el-button>
      </el-badge>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Warning, InfoFilled, Close, Bell } from '@element-plus/icons-vue'

const props = defineProps({
  alerts: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['dismiss'])

const showDetail = ref(false)

function dismissAlert(alert) {
  emit('dismiss', alert)
}

function formatTime(timestamp) {
  if (!timestamp) return '刚刚'
  const now = new Date()
  const time = new Date(timestamp)
  const diff = Math.floor((now - time) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return time.toLocaleString('zh-CN')
}
</script>

<style scoped>
.alert-notifications {
  position: fixed;
  top: 80px;
  right: 340px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(16, 32, 60, 0.95);
  border: 1px solid;
  border-radius: 8px;
  min-width: 300px;
  backdrop-filter: blur(10px);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.alert-item.warning {
  border-color: #faad14;
  box-shadow: 0 4px 20px rgba(250, 173, 20, 0.2);
}

.alert-item.danger {
  border-color: #ff4d4f;
  box-shadow: 0 4px 20px rgba(255, 77, 79, 0.2);
}

.alert-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning .alert-icon {
  background: rgba(250, 173, 20, 0.2);
  color: #faad14;
}

.danger .alert-icon {
  background: rgba(255, 77, 79, 0.2);
  color: #ff4d4f;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-title {
  display: block;
  font-size: 13px;
  color: #fff;
  font-weight: 500;
  margin-bottom: 4px;
}

.alert-time {
  font-size: 11px;
  color: #8c8c8c;
}

.close-btn {
  color: #8c8c8c;
  padding: 4px;
}

.close-btn:hover {
  color: #fff;
}

.alert-summary {
  position: fixed;
  bottom: 20px;
  right: 20px;
  cursor: pointer;
}

.alert-badge {
  cursor: pointer;
}

.alert-enter-active,
.alert-leave-active {
  transition: all 0.3s ease;
}

.alert-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.alert-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
