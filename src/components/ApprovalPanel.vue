<template>
  <el-drawer
    v-model="visible"
    title="审批中心"
    direction="rtl"
    size="500px"
    class="approval-panel"
  >
    <div class="panel-content">
      <el-tabs v-model="activeTab" class="approval-tabs">
        <el-tab-pane label="待我审批" name="pending">
          <div class="request-list">
            <div 
              v-for="request in myPendingRequests" 
              :key="request.id"
              class="request-card"
              @click="selectedRequest = request"
              :class="{ active: selectedRequest?.id === request.id }"
            >
              <div class="request-header">
                <span class="request-id">{{ request.id }}</span>
                <el-tag :type="priorityType(request.priority)" size="small">
                  {{ priorityText(request.priority) }}
                </el-tag>
              </div>
              <div class="request-info">
                <span class="request-item">{{ request.ingredient }}</span>
                <span class="request-qty">{{ request.requestedQuantity }} {{ request.unit }}</span>
              </div>
              <div class="request-time">
                申请时间: {{ formatDate(request.createdAt) }}
              </div>
              <div class="approval-steps">
                <div 
                  v-for="(step, index) in request.approvalFlow" 
                  :key="index"
                  class="step"
                  :class="{ 
                    done: step.status === 'approved', 
                    current: step.status === 'pending' && isMyTurn(request, index),
                    rejected: step.status === 'rejected'
                  }"
                >
                  <div class="step-dot">
                    <el-icon v-if="step.status === 'approved'" size="12"><Check /></el-icon>
                    <el-icon v-else-if="step.status === 'rejected'" size="12"><Close /></el-icon>
                  </div>
                  <span class="step-label">{{ stepLabel(step.role) }}</span>
                </div>
              </div>
            </div>
            <div v-if="myPendingRequests.length === 0" class="empty">
              <el-icon :size="48" color="#8c8c8c"><CircleCheck /></el-icon>
              <p>暂无待审批项</p>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="全部申请" name="all">
          <div class="request-list">
            <div 
              v-for="request in allRequests" 
              :key="request.id"
              class="request-card"
            >
              <div class="request-header">
                <span class="request-id">{{ request.id }}</span>
                <el-tag :type="statusType(request.status)" size="small">
                  {{ statusText(request.status) }}
                </el-tag>
              </div>
              <div class="request-info">
                <span class="request-item">{{ request.ingredient }}</span>
                <span class="request-qty">{{ request.requestedQuantity }} {{ request.unit }}</span>
              </div>
              <div class="request-time">
                申请时间: {{ formatDate(request.createdAt) }}
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div v-if="selectedRequest && myRole" class="approval-action">
        <div class="action-header">
          <h4>审批操作</h4>
          <span class="current-step">{{ currentStepLabel }}</span>
        </div>
        
        <el-form :model="approvalForm" label-width="80px">
          <el-form-item label="审批意见">
            <el-input 
              v-model="approvalForm.comment" 
              type="textarea"
              :rows="3"
              placeholder="请输入审批意见（选填）"
            />
          </el-form-item>
          
          <div class="action-buttons">
            <el-button type="success" @click="handleApprove">
              <el-icon><Check /></el-icon>审批通过
            </el-button>
            <el-button type="danger" @click="handleReject">
              <el-icon><Close /></el-icon>驳回申请
            </el-button>
          </div>
        </el-form>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Close, CircleCheck } from '@element-plus/icons-vue'
import { inventoryManager } from '../managers/InventoryManager.js'
import { authManager } from '../managers/AuthManager.js'

const props = defineProps({
  visible: Boolean,
  user: Object
})

const emit = defineEmits(['update:visible'])

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const activeTab = ref('pending')
const selectedRequest = ref(null)
const approvalForm = ref({
  comment: ''
})

const myRole = computed(() => {
  if (!props.user) return null
  const roleMap = {
    'warehouse': 'warehouse',
    'quality': 'quality',
    'manager': 'warehouse',
    'director': 'director'
  }
  if (props.user.role === 'manager') return 'warehouse'
  if (props.user.role === 'quality') return 'quality'
  if (props.user.role === 'director') return 'director'
  return null
})

const myPendingRequests = computed(() => {
  if (!myRole.value) return []
  return inventoryManager.getRequestsByRole(myRole.value)
})

const allRequests = computed(() => {
  return inventoryManager.replenishmentRequests
})

const currentStepLabel = computed(() => {
  if (!myRole.value) return ''
  const labels = {
    'warehouse': '仓库管理员审批',
    'quality': '品控经理审批',
    'director': '运营总监审批'
  }
  return labels[myRole.value] || ''
})

function isMyTurn(request, stepIndex) {
  if (!myRole.value) return false
  const step = request.approvalFlow[stepIndex]
  return step.role === myRole.value && step.status === 'pending'
}

function priorityType(priority) {
  const types = {
    'urgent': 'danger',
    'high': 'warning',
    'medium': 'primary',
    'low': 'info'
  }
  return types[priority] || 'info'
}

function priorityText(priority) {
  const texts = {
    'urgent': '紧急',
    'high': '高',
    'medium': '中',
    'low': '低'
  }
  return texts[priority] || priority
}

function statusType(status) {
  const types = {
    'pending_warehouse': 'warning',
    'pending_quality': 'warning',
    'pending_director': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    'completed': 'success'
  }
  return types[status] || 'info'
}

function statusText(status) {
  const texts = {
    'pending_warehouse': '待仓库审批',
    'pending_quality': '待品控审批',
    'pending_director': '待总监审批',
    'approved': '审批通过',
    'rejected': '已拒绝',
    'completed': '已完成'
  }
  return texts[status] || status
}

function stepLabel(role) {
  const labels = {
    'warehouse': '仓库管理员',
    'quality': '品控经理',
    'director': '运营总监'
  }
  return labels[role] || role
}

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

function handleApprove() {
  if (!selectedRequest.value || !myRole.value) return

  const result = inventoryManager.approveRequest(
    selectedRequest.value.id,
    myRole.value,
    props.user?.name || '系统',
    approvalForm.value.comment
  )

  if (result) {
    ElMessage.success('审批通过')
    authManager.recordOperationLog(
      '审批补货申请',
      `${selectedRequest.value.id} - 通过`,
      'success'
    )
    selectedRequest.value = null
    approvalForm.value.comment = ''
  }
}

function handleReject() {
  if (!selectedRequest.value || !myRole.value) return

  if (!approvalForm.value.comment) {
    ElMessage.warning('请填写驳回原因')
    return
  }

  const result = inventoryManager.rejectRequest(
    selectedRequest.value.id,
    myRole.value,
    props.user?.name || '系统',
    approvalForm.value.comment
  )

  if (result) {
    ElMessage.info('申请已驳回')
    authManager.recordOperationLog(
      '驳回补货申请',
      `${selectedRequest.value.id} - 驳回`,
      'success'
    )
    selectedRequest.value = null
    approvalForm.value.comment = ''
  }
}
</script>

<style scoped>
.approval-panel :deep(.el-drawer) {
  background: rgba(16, 32, 60, 0.95);
}

.approval-panel :deep(.el-drawer__header) {
  border-bottom: 1px solid rgba(24, 144, 255, 0.2);
  color: #fff;
}

.approval-panel :deep(.el-drawer__body) {
  padding: 0;
}

.panel-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.approval-tabs :deep(.el-tabs__item) {
  color: #8c8c8c;
}

.approval-tabs :deep(.el-tabs__item.is-active) {
  color: #1890ff;
}

.approval-tabs :deep(.el-tabs__active-bar) {
  background: #1890ff;
}

.request-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.request-card {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.request-card:hover {
  border-color: rgba(24, 144, 255, 0.5);
  background: rgba(24, 144, 255, 0.05);
}

.request-card.active {
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.request-id {
  font-size: 14px;
  font-weight: 600;
  color: #1890ff;
}

.request-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.request-item {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.request-qty {
  font-size: 14px;
  color: #52c41a;
  font-weight: 600;
}

.request-time {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 10px;
}

.approval-steps {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  position: relative;
}

.step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 6px;
  left: 60%;
  right: -40%;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
}

.step-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  color: #fff;
}

.step.done .step-dot {
  background: #52c41a;
  border-color: #52c41a;
}

.step.current .step-dot {
  background: #faad14;
  border-color: #faad14;
  animation: pulse 1.5s ease-in-out infinite;
}

.step.rejected .step-dot {
  background: #ff4d4f;
  border-color: #ff4d4f;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(250, 173, 20, 0); }
  50% { box-shadow: 0 0 8px rgba(250, 173, 20, 0.6); }
}

.step-label {
  font-size: 10px;
  color: #8c8c8c;
  text-align: center;
}

.step.done .step-label {
  color: #52c41a;
}

.step.current .step-label {
  color: #faad14;
}

.step.rejected .step-label {
  color: #ff4d4f;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: #8c8c8c;
}

.empty p {
  margin: 0;
  font-size: 14px;
}

.approval-action {
  padding: 16px;
  background: rgba(24, 144, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(24, 144, 255, 0.2);
  margin-top: auto;
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.action-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.current-step {
  font-size: 12px;
  color: #1890ff;
  padding: 2px 8px;
  background: rgba(24, 144, 255, 0.1);
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-buttons .el-button {
  flex: 1;
}
</style>
