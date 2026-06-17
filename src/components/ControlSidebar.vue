<template>
  <div class="control-sidebar" :class="{ 'collapsed': !visible }">
    <div class="sidebar-header">
      <span class="sidebar-title">控制面板</span>
    </div>

    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      background-color="transparent"
      text-color="#8c8c8c"
      active-text-color="#1890ff"
      @select="handleMenuSelect"
    >
      <el-menu-item index="overview">
        <el-icon><DataAnalysis /></el-icon>
        <span>总览概览</span>
      </el-menu-item>

      <el-sub-menu index="areas">
        <template #title>
          <el-icon><Location /></el-icon>
          <span>区域导航</span>
        </template>
        <el-menu-item index="area-all" @click="$emit('focus-area', '全局')">
          <el-icon><Aim /></el-icon>
          <span>全局视图</span>
        </el-menu-item>
        <el-menu-item index="area-storage" @click="$emit('focus-area', '原料仓储区')">
          <el-icon><Box /></el-icon>
          <span>原料仓储区</span>
        </el-menu-item>
        <el-menu-item index="area-processing" @click="$emit('focus-area', '初加工间')">
          <el-icon><Tools /></el-icon>
          <span>初加工间</span>
        </el-menu-item>
        <el-menu-item index="area-cooking" @click="$emit('focus-area', '热厨区')">
          <el-icon><Cpu /></el-icon>
          <span>热厨区</span>
        </el-menu-item>
        <el-menu-item index="area-packaging" @click="$emit('focus-area', '包装区')">
          <el-icon><Box /></el-icon>
          <span>包装区</span>
        </el-menu-item>
        <el-menu-item index="area-coldchain" @click="$emit('focus-area', '冷链配送区')">
          <el-icon><Van /></el-icon>
          <span>冷链配送区</span>
        </el-menu-item>
        <el-menu-item index="area-control" @click="$emit('focus-area', '调度中心')">
          <el-icon><Monitor /></el-icon>
          <span>调度中心</span>
        </el-menu-item>
      </el-sub-menu>

      <el-menu-item index="scheduling" @click="showScheduling = !showScheduling">
        <el-icon><Clock /></el-icon>
        <span>智能调度</span>
      </el-menu-item>

      <el-menu-item index="inventory" @click="showInventory = !showInventory">
        <el-icon><List /></el-icon>
        <span>库存管理</span>
        <el-badge :value="lowStockCount" class="menu-badge" :hidden="lowStockCount === 0" />
      </el-menu-item>

      <div v-show="showScheduling" class="scheduling-panel">
        <div class="panel-section">
          <div class="section-header">
            <span class="section-title">待处理订单</span>
            <el-button size="small" type="primary" @click.stop="handleAutoAssignAll">
              自动分配
            </el-button>
          </div>
          <div class="order-list">
            <div 
              v-for="order in pendingOrders.slice(0, 5)" 
              :key="order.id"
              class="order-item"
            >
              <div class="order-header">
                <span class="order-id">{{ order.id }}</span>
                <el-tag :type="priorityType(order.priority)" size="small">
                  {{ priorityText(order.priority) }}
                </el-tag>
              </div>
              <div class="order-info">
                <span class="order-dish">{{ order.dish }}</span>
                <span class="order-qty">{{ order.quantity }}份</span>
              </div>
              <div class="order-meta">
                <span>交货: {{ formatDeliveryTime(order.deliveryTime) }}</span>
              </div>
              <div class="order-actions">
                <el-button 
                size="small" 
                type="primary"
                @click.stop="handleAssignOrder(order)"
              >
                分配工位
              </el-button>
              </div>
            </div>
          </div>
          <div v-if="pendingOrders.length === 0" class="empty">
            暂无待处理订单
          </div>
        </div>

        <div class="panel-section">
          <div class="section-header">
            <span class="section-title">工位负载率</span>
          </div>
          <div class="workstation-loads">
            <div 
              v-for="ws in workstationLoads.slice(0, 6)" 
              :key="ws.id"
              class="load-item"
            >
              <div class="load-header">
                <span>{{ ws.id }}</span>
                <span :class="loadLevel(ws.currentLoad)">{{ ws.currentLoad.toFixed(0) }}%</span>
              </div>
              <el-progress 
                :percentage="ws.currentLoad" 
                :stroke-width="8"
                :color="loadColor(ws.currentLoad)"
              />
            </div>
          </div>
        </div>

        <div class="panel-section">
          <div class="section-header">
            <span class="section-title">维护批次安排</span>
          </div>
          <div class="maintenance-list">
            <div 
              v-for="mt in maintenanceSchedule" 
              :key="mt.id"
              class="maintenance-item"
              :class="{ 'need-maintenance': mt.type === 'scheduled' }"
            >
              <div class="mt-header">
                <span class="mt-id">{{ mt.id }}</span>
                <el-tag size="small" :type="mt.status === 'scheduled' ? 'warning' : 'success'">
                  {{ mt.status === 'scheduled' ? '待执行' : '已完成' }}
                </el-tag>
              </div>
              <div class="mt-info">
                <span>工位: {{ mt.workstationId }}</span>
                <span>时长: {{ mt.duration }}分钟</span>
              </div>
              <div class="mt-desc">{{ mt.description }}</div>
              <div class="mt-time">
                安排时间: {{ formatDate(mt.scheduledTime) }}
              </div>
              <el-button 
                v-if="mt.status === 'scheduled'" 
                size="small" 
                type="success"
                @click.stop="handleCompleteMaintenance(mt.id)"
              >
                完成维护
              </el-button>
            </div>
          </div>
          <div v-if="maintenanceSchedule.length === 0" class="empty">
            暂无维护安排
          </div>
        </div>

        <div class="panel-section">
          <div class="section-header">
            <span class="section-title">推荐工位</span>
          </div>
          <div class="recommendation-list">
            <div 
              v-for="rec in recommendations" 
              :key="rec.workstationId"
              class="rec-item"
            >
              <span>{{ rec.workstationId }}</span>
              <span class="rec-score">推荐指数: {{ rec.score.toFixed(2) }}</span>
              <span :class="rec.level">{{ rec.level }}</span>
            </div>
          </div>
        </div>
      </div>

      <el-menu-item index="approval" @click="$emit('update:showApproval', true)">
        <el-icon><Check /></el-icon>
        <span>审批中心</span>
        <el-badge :value="pendingApprovalCount" class="menu-badge" :hidden="pendingApprovalCount === 0" />
      </el-menu-item>

      <el-menu-item index="equipment" @click="$emit('update:showEquipment', true)">
        <el-icon><Tools /></el-icon>
        <span>设备管理</span>
      </el-menu-item>

      <el-menu-item index="coldchain">
        <el-icon><Van /></el-icon>
        <span>冷链监控</span>
      </el-menu-item>

      <el-sub-menu index="environment">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>环境监控</span>
        </template>
        <el-menu-item index="env-temperature">
          <span class="env-item">
            <span>温度</span>
            <span class="env-value normal">{{ environmentData.temperature?.toFixed(1) }}°C</span>
          </span>
        </el-menu-item>
        <el-menu-item index="env-humidity">
          <span class="env-item">
            <span>湿度</span>
            <span class="env-value">{{ environmentData.humidity?.toFixed(1) }}%</span>
          </span>
        </el-menu-item>
        <el-menu-item index="env-co2">
          <span class="env-item">
            <span>CO₂浓度</span>
            <span class="env-value warning">{{ environmentData.co2?.toFixed(0) }} ppm</span>
          </span>
        </el-menu-item>
      </el-sub-menu>

      <el-menu-item index="reports" @click="showReportDialog = true">
        <el-icon><Document /></el-icon>
        <span>报表导出</span>
      </el-menu-item>
    </el-menu>

    <el-dialog
      v-model="showReportDialog"
      title="导出生产日报"
      width="400px"
      class="report-dialog"
    >
      <el-form label-width="80px">
        <el-form-item label="选择日期">
          <el-date-picker
            v-model="selectedReportDate"
            type="date"
            placeholder="选择日期（不选默认今天）"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleExportReport">
          导出报表
        </el-button>
      </template>
    </el-dialog>

    <div class="sidebar-footer">
      <div class="quick-actions">
        <el-button 
          type="warning" 
          size="small" 
          :icon="Warning"
          @click="$emit('trigger-event', 'newVentilation')"
        >
          模拟环境预警
        </el-button>
      </div>
      
      <div class="system-status">
        <div class="status-item">
          <span class="status-dot online"></span>
          <span>系统在线</span>
        </div>
        <div class="status-item">
          <span class="status-dot warning"></span>
          <span>{{ lowStockCount }} 项库存预警</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  DataAnalysis, Location, Aim, Box, Cpu,
  Van, Monitor, Clock, List, Check, Tools,
  Setting, Document, Warning, WindPower
} from '@element-plus/icons-vue'
import { inventoryManager } from '../managers/InventoryManager.js'
import { schedulingManager } from '../managers/SchedulingManager.js'
import { ElMessage } from 'element-plus'

const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  user: {
    type: Object,
    default: null
  },
  environmentData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'focus-area',
  'trigger-event',
  'export-report',
  'update:showApproval',
  'update:showEquipment'
])

const activeMenu = ref('overview')
const showScheduling = ref(false)
const showInventory = ref(false)
const showReportDialog = ref(false)
const selectedReportDate = ref('')

const lowStockCount = computed(() => {
  return inventoryManager.checkLowStock().length
})

const pendingApprovalCount = computed(() => {
  return inventoryManager.getPendingRequests().length
})

function handleMenuSelect(index) {
  activeMenu.value = index
}

function handleExportReport() {
  emit('export-report', selectedReportDate.value)
  showReportDialog.value = false
  selectedReportDate.value = ''
}

const pendingOrders = computed(() => schedulingManager.getPendingOrders())

const workstationLoads = computed(() => schedulingManager.getWorkstationStats())

const maintenanceSchedule = computed(() => schedulingManager.maintenanceSchedule)

const recommendations = computed(() => {
  const loads = schedulingManager.getWorkstationStats()
  return loads.map(ws => {
    const score = 100 - ws.currentLoad
    let level = '空闲'
    if (ws.currentLoad > 70) level = '繁忙'
    else if (ws.currentLoad > 40) level = '正常'
    return {
      workstationId: ws.id,
      currentLoad: ws.currentLoad,
      score,
      level
    }
  }).sort((a, b) => b.score - a.score).slice(0, 5)
})

function priorityType(priority) {
  const map = { high: 'danger', medium: 'warning', low: 'info' }
  return map[priority] || 'info'
}

function priorityText(priority) {
  const map = { high: '紧急', medium: '普通', low: '低' }
  return map[priority] || '低'
}

function loadLevel(load) {
  if (load > 70) return 'load-high'
  if (load > 40) return 'load-medium'
  return 'load-low'
}

function loadColor(load) {
  if (load > 70) return '#f56c6c'
  if (load > 40) return '#e6a23c'
  return '#67c23a'
}

function formatDeliveryTime(date) {
  const d = new Date(date)
  const now = new Date()
  const diff = d - now
  const hours = Math.floor(diff / 3600000)
  if (hours < 0) return '已超时'
  if (hours < 1) return `${Math.floor(diff / 60000)}分钟后`
  if (hours < 24) return `${hours}小时后`
  return `${Math.floor(hours / 24)}天后`
}

function formatDate(date) {
  const d = new Date(date)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function handleAssignOrder(order) {
  const wsId = schedulingManager.assignOptimalWorkstation(order)
  if (wsId) {
    ElMessage.success(`订单 ${order.id} 已分配到工位 ${wsId}`)
  } else {
    ElMessage.error('分配失败，请检查工位状态')
  }
}

function handleAutoAssignAll() {
  const pending = schedulingManager.getPendingOrders()
  let successCount = 0
  pending.forEach(order => {
    const wsId = schedulingManager.assignOptimalWorkstation(order)
    if (wsId) successCount++
  })
  ElMessage.success(`已自动分配 ${successCount} 个订单`)
}

function handleCompleteMaintenance(maintenanceId) {
  schedulingManager.completeMaintenance(maintenanceId)
  ElMessage.success(`维护批次 ${maintenanceId} 已完成`)
}
</script>

<style scoped>
.control-sidebar {
  position: fixed;
  top: 60px;
  left: 0;
  bottom: 0;
  width: 260px;
  background: linear-gradient(180deg, rgba(16, 32, 60, 0.95) 0%, rgba(10, 22, 40, 0.95) 100%);
  border-right: 1px solid rgba(24, 144, 255, 0.2);
  z-index: 90;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;
}

.control-sidebar.collapsed {
  transform: translateX(-100%);
}

.sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(24, 144, 255, 0.2);
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
}

.sidebar-menu :deep(.el-menu) {
  background: transparent;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: rgba(24, 144, 255, 0.1);
}

.sidebar-menu :deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
}

.menu-badge {
  margin-left: auto;
}

.env-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 10px;
}

.env-value {
  font-size: 12px;
  color: #8c8c8c;
}

.env-value.normal {
  color: #52c41a;
}

.env-value.warning {
  color: #faad14;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(24, 144, 255, 0.2);
}

.quick-actions {
  margin-bottom: 16px;
}

.quick-actions .el-button {
  width: 100%;
}

.system-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #8c8c8c;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: #52c41a;
  box-shadow: 0 0 8px rgba(82, 196, 26, 0.6);
}

.status-dot.warning {
  background: #faad14;
  box-shadow: 0 0 8px rgba(250, 173, 20, 0.6);
}

.status-dot.danger {
  background: #ff4d4f;
  box-shadow: 0 0 8px rgba(255, 77, 79, 0.6);
}

.scheduling-panel {
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(24, 144, 255, 0.2);
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.panel-section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #1890ff;
}

.order-list, .maintenance-list, .recommendation-list, .workstation-loads {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-item, .maintenance-item, .rec-item, .load-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(24, 144, 255, 0.2);
  border-radius: 6px;
  padding: 8px;
  font-size: 12px;
}

.order-header, .mt-header, .load-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.order-id, .mt-id {
  font-weight: 600;
  color: #fff;
}

.order-info {
  display: flex;
  justify-content: space-between;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.order-dish {
  color: #fff;
}

.order-meta {
  font-size: 11px;
  color: #8c8c8c;
  margin-bottom: 6px;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
}

.mt-info {
  display: flex;
  justify-content: space-between;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.mt-desc {
  color: #fff;
  margin-bottom: 4px;
}

.mt-time {
  font-size: 11px;
  color: #8c8c8c;
  margin-bottom: 6px;
}

.maintenance-item.need-maintenance {
  border-color: #faad14;
  background: rgba(250, 173, 20, 0.1);
}

.rec-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #8c8c8c;
}

.rec-score {
  color: #1890ff;
  font-weight: 600;
}

.rec-item .空闲 {
  color: #52c41a;
}

.rec-item .正常 {
  color: #1890ff;
}

.rec-item .繁忙 {
  color: #faad14;
}

.load-high {
  color: #f56c6c;
  font-weight: 600;
}

.load-medium {
  color: #e6a23c;
  font-weight: 600;
}

.load-low {
  color: #67c23a;
  font-weight: 600;
}

.empty {
  text-align: center;
  color: #8c8c8c;
  font-size: 12px;
  padding: 12px;
}
</style>
