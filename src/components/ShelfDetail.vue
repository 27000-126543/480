<template>
  <el-dialog
    v-model="visible"
    :title="`货架详情 - ${data?.id || ''}`"
    width="520px"
    class="shelf-detail"
    :close-on-click-modal="false"
  >
    <div v-if="data" class="detail-content">
      <div class="shelf-info">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">食材名称</span>
            <span class="value highlight">{{ data.ingredient }}</span>
          </div>
          <div class="info-item">
            <span class="label">库存状态</span>
            <el-tag :type="stockStatusType" size="small">{{ stockStatusText }}</el-tag>
          </div>
        </div>

        <div class="stock-display">
          <div class="stock-info">
            <span class="stock-value">{{ currentStock }}</span>
            <span class="stock-unit">{{ data.unit || 'kg' }}</span>
            <span class="stock-max">/ {{ currentMaxStock }}</span>
          </div>
          <div class="stock-bar">
            <div class="stock-bar-fill" :style="{ width: stockPercentage + '%', background: stockBarColor }"></div>
            <div class="threshold-line" :style="{ left: thresholdPercentage + '%' }">
              <span class="threshold-label">安全线</span>
            </div>
          </div>
          <div class="stock-labels">
            <span>0</span>
            <span class="threshold-text" :style="{ left: thresholdPercentage + '%' }">{{ currentThreshold }}</span>
            <span>{{ currentMaxStock }}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="section-title">库存详情</div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">安全阈值</span>
            <span class="detail-value">{{ currentThreshold }} {{ data.unit || 'kg' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">库存占比</span>
            <span class="detail-value">{{ stockPercentage.toFixed(1) }}%</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">供应商</span>
            <span class="detail-value">{{ inventoryItem?.supplier || '供应商A' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">保质期至</span>
            <span class="detail-value">{{ formatDate(inventoryItem?.expiryDate) }}</span>
          </div>
        </div>
      </div>

      <div v-if="currentStock < currentThreshold" class="warning-section">
        <el-alert
          title="库存低于安全阈值"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            当前库存已低于安全阈值，建议及时补货。
            <el-button type="primary" size="small" @click="showReplenishForm = true">
              立即补货
            </el-button>
          </template>
        </el-alert>
      </div>

      <div v-if="showReplenishForm" class="replenish-form">
        <el-form :model="replenishForm" label-width="80px">
          <el-form-item label="补货数量">
            <el-input-number 
              v-model="replenishForm.quantity" 
              :min="1" 
              :max="data.maxStock - data.stock"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitReplenishment">提交申请</el-button>
            <el-button @click="showReplenishForm = false">取消</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="approval-section">
        <div class="section-title">补货申请记录</div>
        <div class="approval-list">
          <div 
            v-for="request in recentRequests" 
            :key="request.id"
            class="approval-item"
          >
            <div class="approval-header">
              <span class="approval-id">{{ request.id }}</span>
              <el-tag :type="getRequestStatusType(request.status)" size="small">
                {{ getRequestStatusText(request.status) }}
              </el-tag>
            </div>
            <div class="approval-info">
              <span>申请数量: {{ request.requestedQuantity }} {{ request.unit }}</span>
              <span>申请时间: {{ formatDate(request.createdAt) }}</span>
            </div>
            <div class="approval-flow">
              <div 
                v-for="(step, index) in request.approvalFlow" 
                :key="index"
                class="flow-step"
                :class="{ active: step.status === 'approved', current: step.status === 'pending' }"
              >
                <div class="step-dot"></div>
                <span class="step-label">{{ getStepLabel(step.role) }}</span>
              </div>
            </div>
          </div>
          <div v-if="recentRequests.length === 0" class="no-record">
            暂无补货申请记录
          </div>
        </div>
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
import { inventoryManager } from '../managers/InventoryManager.js'
import { authManager } from '../managers/AuthManager.js'

const props = defineProps({
  visible: Boolean,
  data: Object
})

const emit = defineEmits(['update:visible', 'create-replenishment'])

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const showReplenishForm = ref(false)
const replenishForm = ref({
  quantity: 100
})

const stockPercentage = computed(() => {
  const stock = inventoryItem.value?.stock ?? props.data?.stock ?? 0
  const max = inventoryItem.value?.maxStock ?? props.data?.maxStock ?? 1
  return (stock / max) * 100
})

const thresholdPercentage = computed(() => {
  const threshold = inventoryItem.value?.threshold ?? props.data?.threshold ?? 0
  const max = inventoryItem.value?.maxStock ?? props.data?.maxStock ?? 1
  return (threshold / max) * 100
})

const currentStock = computed(() => {
  return inventoryItem.value?.stock ?? props.data?.stock ?? 0
})

const currentMaxStock = computed(() => {
  return inventoryItem.value?.maxStock ?? props.data?.maxStock ?? 0
})

const currentThreshold = computed(() => {
  return inventoryItem.value?.threshold ?? props.data?.threshold ?? 0
})

const stockStatusText = computed(() => {
  const stock = currentStock.value
  const threshold = currentThreshold.value
  const max = currentMaxStock.value
  if (stock < threshold * 0.5) return '严重不足'
  if (stock < threshold) return '库存偏低'
  if (stock < max * 0.3) return '库存正常'
  return '库存充足'
})

const stockStatusType = computed(() => {
  const stock = currentStock.value
  const threshold = currentThreshold.value
  if (stock < threshold * 0.5) return 'danger'
  if (stock < threshold) return 'warning'
  return 'success'
})

const stockBarColor = computed(() => {
  const stock = currentStock.value
  const threshold = currentThreshold.value
  if (stock < threshold * 0.5) return '#ff4d4f'
  if (stock < threshold) return '#faad14'
  return '#52c41a'
})

const inventoryItem = computed(() => {
  return inventoryManager.getInventoryItem(props.data?.id)
})

const recentRequests = computed(() => {
  return inventoryManager.replenishmentRequests
    .filter(r => r.shelfId === props.data?.id)
    .slice(0, 3)
})

function formatDate(date) {
  if (!date) return '--'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getRequestStatusType(status) {
  const typeMap = {
    'pending_warehouse': 'warning',
    'pending_quality': 'warning',
    'pending_director': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    'completed': 'success'
  }
  return typeMap[status] || 'info'
}

function getRequestStatusText(status) {
  const textMap = {
    'pending_warehouse': '待仓库审批',
    'pending_quality': '待品控审批',
    'pending_director': '待总监审批',
    'approved': '审批通过',
    'rejected': '已拒绝',
    'completed': '已完成'
  }
  return textMap[status] || status
}

function getStepLabel(role) {
  const labelMap = {
    'warehouse': '仓库管理员',
    'quality': '品控经理',
    'director': '运营总监'
  }
  return labelMap[role] || role
}

function submitReplenishment() {
  if (!replenishForm.value.quantity) {
    ElMessage.warning('请输入补货数量')
    return
  }

  emit('create-replenishment', props.data.id, replenishForm.value.quantity)
  showReplenishForm.value = false
  replenishForm.value.quantity = 100
}

watch(() => props.visible, (val) => {
  if (val) {
    showReplenishForm.value = false
  }
})
</script>

<style scoped>
.shelf-detail :deep(.el-dialog) {
  background: rgba(16, 32, 60, 0.95);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(20px);
}

.shelf-detail :deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(24, 144, 255, 0.2);
}

.shelf-detail :deep(.el-dialog__title) {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.shelf-detail :deep(.el-dialog__body) {
  padding: 20px;
  color: #e6f7ff;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shelf-info {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.info-grid {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.info-item {
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
  font-size: 18px;
  font-weight: 700;
}

.stock-display {
  margin-top: 12px;
}

.stock-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 12px;
}

.stock-value {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
}

.stock-unit {
  font-size: 14px;
  color: #8c8c8c;
}

.stock-max {
  font-size: 14px;
  color: #8c8c8c;
  margin-left: 8px;
}

.stock-bar {
  position: relative;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: visible;
}

.stock-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.threshold-line {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  background: #faad14;
  transform: translateX(-50%);
}

.threshold-label {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #faad14;
  white-space: nowrap;
}

.stock-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: #8c8c8c;
  position: relative;
}

.threshold-text {
  position: absolute;
  transform: translateX(-50%);
  color: #faad14;
}

.detail-section, .approval-section {
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
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #8c8c8c;
}

.detail-value {
  font-size: 13px;
  color: #fff;
}

.warning-section {
  margin-top: 8px;
}

.replenish-form {
  margin-top: 12px;
  padding: 12px;
  background: rgba(24, 144, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(24, 144, 255, 0.2);
}

.approval-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.approval-item {
  padding: 10px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.approval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.approval-id {
  font-size: 13px;
  font-weight: 600;
  color: #1890ff;
}

.approval-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 10px;
}

.approval-flow {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  position: relative;
}

.flow-step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 5px;
  left: 60%;
  right: -40%;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
}

.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  z-index: 1;
}

.flow-step.active .step-dot {
  background: #52c41a;
  border-color: #52c41a;
  box-shadow: 0 0 8px rgba(82, 196, 26, 0.6);
}

.flow-step.current .step-dot {
  background: #faad14;
  border-color: #faad14;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(250, 173, 20, 0); }
  50% { box-shadow: 0 0 10px rgba(250, 173, 20, 0.6); }
}

.step-label {
  font-size: 10px;
  color: #8c8c8c;
}

.flow-step.active .step-label {
  color: #52c41a;
}

.flow-step.current .step-label {
  color: #faad14;
}

.no-record {
  text-align: center;
  padding: 20px;
  color: #8c8c8c;
  font-size: 13px;
}
</style>
