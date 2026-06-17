<template>
  <el-dialog
    v-model="visible"
    :title="`配送车详情 - ${data?.id || ''}`"
    width="560px"
    class="vehicle-detail"
    :close-on-click-modal="false"
  >
    <div v-if="vehicleInfo" class="detail-content">
      <div class="vehicle-header">
        <div class="vehicle-icon" :class="{ warning: isWarning }">
          <el-icon :size="32"><Van /></el-icon>
        </div>
        <div class="vehicle-basic">
          <h3 class="vehicle-name">{{ vehicleInfo.plateNumber }}</h3>
          <p class="vehicle-model">{{ vehicleInfo.model }}</p>
          <el-tag :type="statusType" size="small">{{ statusText }}</el-tag>
        </div>
      </div>

      <div class="temp-monitor">
        <div class="temp-display" :class="{ danger: isTempWarning }">
          <div class="temp-icon">
            <el-icon :size="28"><HotWater /></el-icon>
          </div>
          <div class="temp-info">
            <span class="temp-value">{{ vehicleInfo.temperature?.toFixed(1) || '--' }}°C</span>
            <span class="temp-label">当前温度</span>
          </div>
          <div class="temp-target">
            目标: {{ vehicleInfo.targetTemperature }}°C
          </div>
        </div>

        <div v-if="vehicleInfo.backupCoolingActive" class="backup-cooling">
          <el-icon class="spin"><Loading /></el-icon>
          <span>备用制冷系统已启动</span>
        </div>

        <div class="temp-range">
          <span>温度范围: {{ vehicleInfo.minTemperature }}°C ~ {{ vehicleInfo.maxTemperature }}°C</span>
        </div>
      </div>

      <div class="info-section">
        <div class="section-title">车辆信息</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">载重容量</span>
            <span class="info-value">{{ vehicleInfo.capacity }} kg</span>
          </div>
          <div class="info-item">
            <span class="info-label">当前载重</span>
            <span class="info-value">{{ vehicleInfo.currentLoad }} kg</span>
          </div>
          <div class="info-item">
            <span class="info-label">载重率</span>
            <span class="info-value" :class="{ warning: loadRate > 80 }">
              {{ loadRate.toFixed(1) }}%
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">驾驶员</span>
            <span class="info-value">{{ vehicleInfo.driver }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">联系电话</span>
            <span class="info-value">{{ vehicleInfo.phone }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">当前位置</span>
            <span class="info-value">{{ currentLocation }}</span>
          </div>
        </div>
      </div>

      <div v-if="vehicleInfo.status === 'delivering'" class="delivery-section">
        <div class="section-title">配送任务</div>
        <div class="delivery-info">
          <div class="delivery-item">
            <span class="delivery-label">目的地</span>
            <span class="delivery-value">朝阳区配送中心</span>
          </div>
          <div class="delivery-item">
            <span class="delivery-label">预计到达</span>
            <span class="delivery-value">{{ formatTime(vehicleInfo.estimatedArrival) }}</span>
          </div>
          <div class="delivery-item">
            <span class="delivery-label">配送进度</span>
            <span class="delivery-value">{{ ((data?.routeProgress || 0) * 100).toFixed(0) }}%</span>
          </div>
        </div>
        <el-progress 
          :percentage="Math.round((data?.routeProgress || 0) * 100)" 
          :stroke-width="8"
          color="#1890ff"
        />
      </div>

      <div class="anomaly-section">
        <div class="section-title">
          <span>异常记录</span>
          <el-badge :value="openAnomalies.length" :hidden="openAnomalies.length === 0" class="badge" />
        </div>
        <div class="anomaly-list">
          <div 
            v-for="anomaly in recentAnomalies" 
            :key="anomaly.id"
            class="anomaly-item"
            :class="anomaly.level"
          >
            <div class="anomaly-header">
              <span class="anomaly-type">{{ anomaly.message }}</span>
              <el-tag :type="anomaly.status === 'open' ? 'danger' : 'success'" size="small">
                {{ anomaly.status === 'open' ? '待处理' : '已处理' }}
              </el-tag>
            </div>
            <div class="anomaly-time">{{ formatTime(anomaly.timestamp) }}</div>
          </div>
          <div v-if="recentAnomalies.length === 0" class="no-anomaly">
            <el-icon :size="24" color="#52c41a"><CircleCheck /></el-icon>
            <span>暂无异常记录</span>
          </div>
        </div>
      </div>

      <div class="action-section">
        <el-button type="primary" @click="handleViewRoute">
          <el-icon><Location /></el-icon>查看路线
        </el-button>
        <el-button type="warning" @click="handleContactDriver">
          <el-icon><Phone /></el-icon>联系司机
        </el-button>
        <el-button type="danger" @click="handleReportAnomaly">
          <el-icon><Warning /></el-icon>上报异常
        </el-button>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Van, HotWater, Loading, Location, Phone, 
  Warning, CircleCheck 
} from '@element-plus/icons-vue'
import { coldChainManager } from '../managers/ColdChainManager.js'
import { authManager } from '../managers/AuthManager.js'

const props = defineProps({
  visible: Boolean,
  data: Object
})

const emit = defineEmits(['update:visible'])

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const vehicleInfo = computed(() => {
  if (!props.data?.id) return null
  return coldChainManager.getVehicleById(props.data.id) || props.data
})

const statusText = computed(() => {
  const statusMap = {
    'idle': '待命',
    'delivering': '配送中',
    'maintenance': '维护中',
    'fault': '故障'
  }
  return statusMap[vehicleInfo.value?.status] || '未知'
})

const statusType = computed(() => {
  const typeMap = {
    'idle': 'success',
    'delivering': 'primary',
    'maintenance': 'warning',
    'fault': 'danger'
  }
  return typeMap[vehicleInfo.value?.status] || 'info'
})

const isTempWarning = computed(() => {
  const temp = vehicleInfo.value?.temperature
  const maxTemp = vehicleInfo.value?.maxTemperature
  return temp && maxTemp && temp > maxTemp
})

const isWarning = computed(() => {
  return isTempWarning.value || vehicleInfo.value?.status === 'fault'
})

const loadRate = computed(() => {
  if (!vehicleInfo.value?.capacity) return 0
  return (vehicleInfo.value.currentLoad / vehicleInfo.value.capacity) * 100
})

const currentLocation = computed(() => {
  if (vehicleInfo.value?.status === 'delivering') return '配送途中'
  if (vehicleInfo.value?.status === 'maintenance') return '维修站'
  return '冷链配送区'
})

const recentAnomalies = computed(() => {
  return coldChainManager.anomalies
    .filter(a => a.vehicleId === props.data?.id)
    .slice(0, 5)
})

const openAnomalies = computed(() => {
  return recentAnomalies.value.filter(a => a.status === 'open')
})

function formatTime(date) {
  if (!date) return '--'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleViewRoute() {
  ElMessage.info('查看配送路线功能')
}

function handleContactDriver() {
  ElMessage.info(`正在联系司机: ${vehicleInfo.value?.driver}`)
}

function handleReportAnomaly() {
  const anomaly = coldChainManager.createAnomaly(
    props.data?.id,
    'manual_report',
    '人工上报异常'
  )
  if (anomaly) {
    ElMessage.success('异常已上报')
    authManager.recordOperationLog('上报车辆异常', props.data?.id, 'success')
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    // 可以在这里刷新数据
  }
})
</script>

<style scoped>
.vehicle-detail :deep(.el-dialog) {
  background: rgba(16, 32, 60, 0.95);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(20px);
}

.vehicle-detail :deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(24, 144, 255, 0.2);
}

.vehicle-detail :deep(.el-dialog__title) {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.vehicle-detail :deep(.el-dialog__body) {
  padding: 20px;
  color: #e6f7ff;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.vehicle-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.vehicle-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: linear-gradient(135deg, #722ed1, #531dab);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vehicle-icon.warning {
  background: linear-gradient(135deg, #ff4d4f, #cf1322);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(255, 77, 79, 0); }
  50% { box-shadow: 0 0 20px rgba(255, 77, 79, 0.6); }
}

.vehicle-basic {
  flex: 1;
}

.vehicle-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px 0;
}

.vehicle-model {
  font-size: 13px;
  color: #8c8c8c;
  margin: 0 0 8px 0;
}

.temp-monitor {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.temp-display {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.temp-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(24, 144, 255, 0.2);
  color: #1890ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.danger .temp-icon {
  background: rgba(255, 77, 79, 0.2);
  color: #ff4d4f;
}

.temp-info {
  flex: 1;
}

.temp-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.danger .temp-value {
  color: #ff4d4f;
}

.temp-label {
  font-size: 12px;
  color: #8c8c8c;
}

.temp-target {
  font-size: 12px;
  color: #52c41a;
  padding: 4px 8px;
  background: rgba(82, 196, 26, 0.1);
  border-radius: 4px;
}

.backup-cooling {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(250, 173, 20, 0.1);
  border: 1px solid rgba(250, 173, 20, 0.3);
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #faad14;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.temp-range {
  font-size: 12px;
  color: #8c8c8c;
  text-align: right;
}

.info-section, .delivery-section, .anomaly-section {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 11px;
  color: #8c8c8c;
}

.info-value {
  font-size: 13px;
  color: #fff;
  font-weight: 500;
}

.info-value.warning {
  color: #faad14;
}

.delivery-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.delivery-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.delivery-label {
  font-size: 11px;
  color: #8c8c8c;
}

.delivery-value {
  font-size: 13px;
  color: #fff;
  font-weight: 500;
}

.anomaly-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.anomaly-item {
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid;
}

.anomaly-item.danger {
  background: rgba(255, 77, 79, 0.1);
  border-color: #ff4d4f;
}

.anomaly-item.warning {
  background: rgba(250, 173, 20, 0.1);
  border-color: #faad14;
}

.anomaly-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.anomaly-type {
  font-size: 13px;
  color: #fff;
  font-weight: 500;
}

.anomaly-time {
  font-size: 11px;
  color: #8c8c8c;
}

.no-anomaly {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px;
  color: #52c41a;
  font-size: 12px;
}

.action-section {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.badge {
  margin-left: auto;
}
</style>
