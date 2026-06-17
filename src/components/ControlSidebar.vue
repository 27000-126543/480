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

      <el-menu-item index="reports" @click="$emit('export-report')">
        <el-icon><Document /></el-icon>
        <span>报表导出</span>
      </el-menu-item>
    </el-menu>

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

const lowStockCount = computed(() => {
  return inventoryManager.checkLowStock().length
})

const pendingApprovalCount = computed(() => {
  return inventoryManager.getPendingRequests().length
})

function handleMenuSelect(index) {
  activeMenu.value = index
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
</style>
