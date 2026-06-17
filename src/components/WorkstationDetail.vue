<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`工位详情 - ${data?.id || ''}`"
    width="600px"
    class="workstation-detail"
    :close-on-click-modal="false"
  >
    <div v-if="data" class="detail-content">
      <div class="info-row">
        <div class="info-item">
          <span class="label">所属区域</span>
          <span class="value">{{ data.area || '初加工间' }}</span>
        </div>
        <div class="info-item">
          <span class="label">当前状态</span>
          <el-tag :type="statusType" size="small">{{ statusText }}</el-tag>
        </div>
      </div>

      <div class="info-row">
        <div class="info-item">
          <span class="label">当前菜品</span>
          <span class="value highlight">{{ data.currentDish }}</span>
        </div>
        <div class="info-item">
          <span class="label">运行时长</span>
          <span class="value">{{ (data.runtime || 0).toFixed(2) }} 小时</span>
        </div>
      </div>

      <div class="env-monitor">
        <div class="env-item">
          <div class="env-label">
            <el-icon color="#ff7a00"><HotWater /></el-icon>
            <span>温度</span>
          </div>
          <div class="env-value" :class="{ warning: data.temperature > 30 }">
            {{ data.temperature?.toFixed(1) || '--' }}°C
          </div>
          <div class="env-bar">
            <div class="env-bar-fill temp" :style="{ width: Math.min(100, (data.temperature / 50) * 100) + '%' }"></div>
          </div>
        </div>
        <div class="env-item">
          <div class="env-label">
            <el-icon color="#1890ff"><Cpu /></el-icon>
            <span>湿度</span>
          </div>
          <div class="env-value">
            {{ data.humidity?.toFixed(1) || '--' }}%
          </div>
          <div class="env-bar">
            <div class="env-bar-fill humidity" :style="{ width: (data.humidity || 0) + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="capacity-section">
        <div class="section-header">
          <span>产能完成率</span>
          <span class="capacity-rate" :class="capacityClass">
            {{ data.capacityRate?.toFixed(1) || 0 }}%
          </span>
        </div>
        <el-progress 
          :percentage="data.capacityRate || 0" 
          :stroke-width="12"
          :color="getCapacityColor(data.capacityRate)"
        />
      </div>

      <div class="chart-section">
        <div class="section-header">
          <span>近24小时生产曲线</span>
          <el-button size="small" type="primary" link @click="refreshChart">
            <el-icon><Refresh /></el-icon>刷新
          </el-button>
        </div>
        <div ref="chartRef" class="chart-container"></div>
      </div>

      <div class="action-section">
        <el-button type="primary" @click="handleViewOrders">查看关联订单</el-button>
        <el-button type="warning" @click="handleScheduleMaintenance">
          <el-icon><Tools /></el-icon>安排维护
        </el-button>
        <el-button type="danger" @click="handleReportFault">
          <el-icon><Warning /></el-icon>上报故障
        </el-button>
      </div>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { HotWater, Cpu, Refresh, Tools, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import Chart from 'chart.js/auto'
import { equipmentManager } from '../managers/EquipmentManager.js'
import { authManager } from '../managers/AuthManager.js'

const props = defineProps({
  visible: Boolean,
  data: Object
})

const emit = defineEmits(['update:visible'])

const chartRef = ref(null)
let chartInstance = null

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const statusText = computed(() => {
  const statusMap = {
    'running': '运行中',
    'maintenance': '维护中',
    'fault': '故障',
    'idle': '空闲'
  }
  return statusMap[props.data?.status] || '运行中'
})

const statusType = computed(() => {
  const typeMap = {
    'running': 'success',
    'maintenance': 'warning',
    'fault': 'danger',
    'idle': 'info'
  }
  return typeMap[props.data?.status] || 'success'
})

const capacityClass = computed(() => {
  const rate = props.data?.capacityRate || 0
  if (rate > 80) return 'high'
  if (rate > 60) return 'medium'
  return 'low'
})

function getCapacityColor(rate) {
  if (rate > 80) return '#ff4d4f'
  if (rate > 60) return '#faad14'
  return '#52c41a'
}

function initChart() {
  if (!chartRef.value) {
    console.warn('Chart container not found')
    return
  }

  try {
    if (chartInstance) {
      chartInstance.destroy()
      chartInstance = null
    }

    const ctx = chartRef.value.getContext('2d')
    if (!ctx) {
      console.warn('Canvas context not available')
      return
    }

    const productionData = generateProductionData()

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: productionData.labels,
        datasets: [
          {
            label: '实际产量',
            data: productionData.values,
            borderColor: '#1890ff',
            backgroundColor: 'rgba(24, 144, 255, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5
          },
          {
            label: '目标产量',
            data: productionData.targets,
            borderColor: '#52c41a',
            borderDash: [5, 5],
            fill: false,
            tension: 0,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#8c8c8c',
              font: { size: 11 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(16, 32, 60, 0.95)',
            titleColor: '#fff',
            bodyColor: '#e6f7ff',
            borderColor: 'rgba(24, 144, 255, 0.3)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#8c8c8c',
              font: { size: 10 }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#8c8c8c',
              font: { size: 10 }
            },
            beginAtZero: true
          }
        }
      }
    })
  } catch (error) {
    console.error('Chart initialization failed:', error)
    ElMessage.error('图表加载失败，请刷新重试')
  }
}

function generateProductionData() {
  const labels = []
  const values = []
  const targets = []
  const now = new Date()

  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600000)
    labels.push(`${hour.getHours()}:00`)
    values.push(Math.floor(60 + Math.random() * 60))
    targets.push(100)
  }

  return { labels, values, targets }
}

function refreshChart() {
  initChart()
  ElMessage.success('数据已刷新')
}

function handleViewOrders() {
  ElMessage.info('查看关联订单功能')
}

function handleScheduleMaintenance() {
  ElMessage.info('安排维护功能')
  authManager.recordOperationLog('安排工位维护', props.data?.id, 'success')
}

function handleReportFault() {
  const equipment = equipmentManager.getEquipmentByWorkstation(props.data?.id)
  if (equipment) {
    const workOrder = equipmentManager.reportFault(
      equipment.id,
      '设备异常上报',
      '工位运行异常，需要检查维修',
      authManager.currentUser.value?.name || '系统'
    )
    if (workOrder) {
      ElMessage.success(`故障已上报，工单编号: ${workOrder.id}`)
      authManager.recordOperationLog('上报设备故障', equipment.id, 'success')
    }
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => {
      initChart()
    })
  } else {
    if (chartInstance) {
      chartInstance.destroy()
      chartInstance = null
    }
  }
})

onMounted(() => {
  if (props.visible) {
    nextTick(() => {
      initChart()
    })
  }
})
</script>

<style scoped>
.workstation-detail :deep(.el-dialog) {
  background: rgba(16, 32, 60, 0.95);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(20px);
}

.workstation-detail :deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(24, 144, 255, 0.2);
  padding: 16px 20px;
}

.workstation-detail :deep(.el-dialog__title) {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.workstation-detail :deep(.el-dialog__body) {
  padding: 20px;
  color: #e6f7ff;
}

.workstation-detail :deep(.el-dialog__footer) {
  border-top: 1px solid rgba(24, 144, 255, 0.2);
  padding: 12px 20px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  gap: 20px;
}

.info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  color: #8c8c8c;
}

.value {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.value.highlight {
  color: #1890ff;
  font-size: 16px;
}

.env-monitor {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.env-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.env-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8c8c8c;
}

.env-value {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.env-value.warning {
  color: #ff4d4f;
}

.env-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.env-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.env-bar-fill.temp {
  background: linear-gradient(90deg, #52c41a, #faad14, #ff4d4f);
}

.env-bar-fill.humidity {
  background: linear-gradient(90deg, #faad14, #1890ff);
}

.capacity-section {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.capacity-rate {
  font-size: 18px;
  font-weight: 700;
}

.capacity-rate.high {
  color: #ff4d4f;
}

.capacity-rate.medium {
  color: #faad14;
}

.capacity-rate.low {
  color: #52c41a;
}

.chart-section {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.chart-container {
  height: 200px;
  width: 100%;
}

.action-section {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
