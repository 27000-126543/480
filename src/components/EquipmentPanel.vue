<template>
  <el-drawer
    v-model="visible"
    title="设备管理"
    direction="rtl"
    size="600px"
    class="equipment-panel"
  >
    <div class="panel-content">
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon running">
          <el-icon :size="24"><Tools /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ equipmentStats.running }}</span>
            <span class="stat-label">运行中</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon fault">
          <el-icon :size="24"><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value danger">{{ equipmentStats.fault }}</span>
            <span class="stat-label">故障</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon maintenance">
          <el-icon :size="24"><Setting /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value warning">{{ equipmentStats.maintenance }}</span>
            <span class="stat-label">维护中</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon availability">
          <el-icon :size="24"><DataLine /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ equipmentStats.availabilityRate }}%</span>
            <span class="stat-label">可用率</span>
          </div>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="equipment-tabs">
        <el-tab-pane label="设备列表" name="list">
          <div class="equipment-list">
            <div 
              v-for="equip in equipmentList" 
              :key="equip.id"
              class="equipment-card"
              @click="selectedEquipment = equip"
              :class="{ 
                active: selectedEquipment?.id === equip.id,
                fault: equip.status === 'fault',
                maintenance: equip.status === 'maintenance'
              }"
            >
              <div class="equip-header">
                <div class="equip-info">
                  <span class="equip-name">{{ equip.name }}</span>
                  <span class="equip-model">{{ equip.model }}</span>
                </div>
                <el-tag :type="statusType(equip.status)" size="small">
                  {{ statusText(equip.status) }}
                </el-tag>
              </div>
              <div class="equip-meta">
                <span>{{ equip.area }}</span>
                <span>工位: {{ equip.workstationId }}</span>
              </div>
              <div class="equip-stats">
                <div class="stat">
                  <span class="label">运行时长</span>
                  <span class="value">{{ (equip.runtime / 1000).toFixed(1) }}k h</span>
                </div>
                <div class="stat">
                  <span class="label">故障次数</span>
                  <span class="value">{{ equip.faultCount }}</span>
                </div>
                <div class="stat">
                  <span class="label">效率</span>
                  <span class="value">{{ equip.efficiency.toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="维修工单" name="workorders">
          <div class="workorder-list">
            <div 
              v-for="order in workOrders" 
              :key="order.id"
              class="workorder-card"
            >
              <div class="order-header">
                <span class="order-id">{{ order.id }}</span>
                <el-tag :type="orderType(order.status)" size="small">
                  {{ orderText(order.status) }}
                </el-tag>
              </div>
              <div class="order-title">{{ order.title }}</div>
              <div class="order-meta">
                <span>设备: {{ order.equipmentId }}</span>
                <span>优先级: {{ order.priority }}</span>
              </div>
              <div class="order-actions">
                <el-button 
                  v-if="order.status === 'pending'" 
                  size="small" 
                  type="primary"
                  @click="handleStartWork(order.id)"
                >
                  开始处理
                </el-button>
                <el-button 
                  v-if="order.status === 'in_progress'" 
                  size="small" 
                  type="success"
                  @click="showCompleteDialog = true; completingOrder = order.id"
                >
                  完成维修
                </el-button>
                <el-button 
                  size="small" 
                  type="info"
                  @click="viewOrderDetail(order)"
                >
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="故障记录" name="history">
          <el-table :data="faultHistory" style="width: 100%" size="small">
            <el-table-column prop="id" label="记录编号" width="100" />
            <el-table-column prop="equipmentId" label="设备" width="100" />
            <el-table-column prop="faultType" label="故障类型" width="120" />
            <el-table-column prop="description" label="故障描述" show-overflow-tooltip />
            <el-table-column prop="downtime" label="停机时间(h)" width="100" />
            <el-table-column prop="occurredAt" label="发生时间" width="150">
              <template #default="{ row }">
                {{ formatDate(row.occurredAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>

      <el-dialog
        v-model="showCompleteDialog"
        title="完成维修"
        width="500px"
      >
        <el-form :model="completeForm" label-width="100px">
          <el-form-item label="维修结果">
            <el-input 
              v-model="completeForm.resolution"
              type="textarea"
              :rows="3"
              placeholder="请输入维修结果"
            />
          </el-form-item>
          <el-form-item label="维修前照片">
            <el-upload
              action="#"
              :auto-upload="false"
              list-type="picture-card"
              :on-change="(file) => handleBeforePhoto(file)"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
          </el-form-item>
          <el-form-item label="维修后照片">
            <el-upload
              action="#"
              :auto-upload="false"
              list-type="picture-card"
              :on-change="(file) => handleAfterPhoto(file)"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showCompleteDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCompleteWork">确认完成</el-button>
        </template>
      </el-dialog>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Tools, Warning, Setting, DataLine, Plus
} from '@element-plus/icons-vue'
import { equipmentManager } from '../managers/EquipmentManager.js'
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

const activeTab = ref('list')
const selectedEquipment = ref(null)
const showCompleteDialog = ref(false)
const completingOrder = ref('')
const completeForm = ref({
  resolution: '',
  beforePhotos: [],
  afterPhotos: []
})

const equipmentStats = computed(() => {
  return equipmentManager.getEquipmentStats()
})

const equipmentList = computed(() => {
  return equipmentManager.equipment
})

const workOrders = computed(() => {
  return equipmentManager.workOrders
})

const faultHistory = computed(() => {
  return equipmentManager.faultHistory
})

function statusType(status) {
  const types = {
    'running': 'success',
    'maintenance': 'warning',
    'fault': 'danger',
    'locked': 'danger'
  }
  return types[status] || 'info'
}

function statusText(status) {
  const texts = {
    'running': '运行中',
    'maintenance': '维护中',
    'fault': '故障',
    'locked': '已锁定'
  }
  return texts[status] || status
}

function orderType(status) {
  const types = {
    'pending': 'warning',
    'assigned': 'primary',
    'in_progress': 'primary',
    'completed': 'success'
  }
  return types[status] || 'info'
}

function orderText(status) {
  const texts = {
    'pending': '待处理',
    'assigned': '已派单',
    'in_progress': '处理中',
    'completed': '已完成'
  }
  return texts[status] || status
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

function handleStartWork(orderId) {
  const result = equipmentManager.startWorkOrder(orderId)
  if (result) {
    ElMessage.success('开始处理工单')
    authManager.recordOperationLog('开始处理工单', orderId, 'success')
  }
}

function handleBeforePhoto(file) {
  completeForm.value.beforePhotos.push(file)
}

function handleAfterPhoto(file) {
  completeForm.value.afterPhotos.push(file)
}

function handleCompleteWork() {
  if (!completeForm.value.resolution) {
    ElMessage.warning('请填写维修结果')
    return
  }

  const result = equipmentManager.completeWorkOrder(
    completingOrder.value,
    completeForm.value.resolution,
    completeForm.value.beforePhotos,
    completeForm.value.afterPhotos
  )

  if (result) {
    ElMessage.success('工单已完成')
    authManager.recordOperationLog('完成维修工单', completingOrder.value, 'success')
    showCompleteDialog.value = false
    completeForm.value = {
      resolution: '',
      beforePhotos: [],
      afterPhotos: []
    }
  }
}

function viewOrderDetail(order) {
  ElMessage.info('查看工单详情')
}
</script>

<style scoped>
.equipment-panel :deep(.el-drawer) {
  background: rgba(16, 32, 60, 0.95);
}

.equipment-panel :deep(.el-drawer__header) {
  border-bottom: 1px solid rgba(24, 144, 255, 0.2);
  color: #fff;
}

.equipment-panel :deep(.el-drawer__body) {
  padding: 0;
}

.panel-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-icon.running {
  background: linear-gradient(135deg, #52c41a, #389e0d);
}

.stat-icon.fault {
  background: linear-gradient(135deg, #ff4d4f, #cf1322);
}

.stat-icon.maintenance {
  background: linear-gradient(135deg, #faad14, #d48806);
}

.stat-icon.availability {
  background: linear-gradient(135deg, #1890ff, #096dd9);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.stat-value.danger {
  color: #ff4d4f;
}

.stat-value.warning {
  color: #faad14;
}

.stat-label {
  font-size: 12px;
  color: #8c8c8c;
}

.equipment-tabs :deep(.el-tabs__item) {
  color: #8c8c8c;
}

.equipment-tabs :deep(.el-tabs__item.is-active) {
  color: #1890ff;
}

.equipment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.equipment-card {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.equipment-card:hover {
  border-color: rgba(24, 144, 255, 0.5);
  background: rgba(24, 144, 255, 0.05);
}

.equipment-card.active {
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
}

.equipment-card.fault {
  border-left: 4px solid #ff4d4f;
}

.equipment-card.maintenance {
  border-left: 4px solid #faad14;
}

.equip-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.equip-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.equip-name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.equip-model {
  font-size: 12px;
  color: #8c8c8c;
}

.equip-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 10px;
}

.equip-stats {
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.equip-stats .stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.equip-stats .label {
  font-size: 11px;
  color: #8c8c8c;
}

.equip-stats .value {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.workorder-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.workorder-card {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.order-id {
  font-size: 13px;
  font-weight: 600;
  color: #1890ff;
}

.order-title {
  font-size: 14px;
  color: #fff;
  margin-bottom: 6px;
}

.order-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 10px;
}

.order-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
