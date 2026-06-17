<template>
  <div class="info-panel">
    <div class="panel-section">
      <div class="section-header">
        <el-icon :size="16" color="#1890ff"><DataLine /></el-icon>
        <span class="section-title">环境监测</span>
      </div>
      <div class="env-cards">
        <div class="env-card">
          <div class="env-icon temp">
            <el-icon :size="20"><HotWater /></el-icon>
          </div>
          <div class="env-info">
            <span class="env-label">温度</span>
            <span class="env-value" :class="{ warning: isTempWarning }">
              {{ environmentData.temperature?.toFixed(1) || '--' }}°C
            </span>
          </div>
        </div>
        <div class="env-card">
          <div class="env-icon humidity">
            <el-icon :size="20"><Cpu /></el-icon>
          </div>
          <div class="env-info">
            <span class="env-label">湿度</span>
            <span class="env-value">
              {{ environmentData.humidity?.toFixed(1) || '--' }}%
            </span>
          </div>
        </div>
        <div class="env-card">
          <div class="env-icon co2" :class="{ active: environmentData.newVentilationActive }">
            <el-icon :size="20"><WindPower /></el-icon>
          </div>
          <div class="env-info">
            <span class="env-label">CO₂浓度</span>
            <span class="env-value" :class="{ danger: isCo2Warning }">
              {{ environmentData.co2?.toFixed(0) || '--' }} ppm
            </span>
          </div>
        </div>
      </div>
      <div v-if="environmentData.newVentilationActive" class="ventilation-status">
        <el-icon class="spin"><Loading /></el-icon>
        <span>新风系统运行中</span>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-header">
        <el-icon :size="16" color="#52c41a"><Tools /></el-icon>
        <span class="section-title">工位状态</span>
      </div>
      <div class="workstation-list">
        <div 
          v-for="ws in workstationData.slice(0, 6)" 
          :key="ws.id" 
          class="ws-item"
          :class="{ fault: ws.status === 'fault', maintenance: ws.status === 'maintenance' }"
        >
          <span class="ws-id">{{ ws.id }}</span>
          <div class="ws-info">
            <span class="ws-dish">{{ ws.currentDish }}</span>
            <div class="ws-progress">
              <el-progress 
                :percentage="ws.capacityRate" 
                :stroke-width="4"
                :color="getCapacityColor(ws.capacityRate)"
                :show-text="false"
              />
            </div>
          </div>
          <span class="ws-rate">{{ ws.capacityRate?.toFixed(0) }}%</span>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-header">
        <el-icon :size="16" color="#faad14"><Box /></el-icon>
        <span class="section-title">库存预警</span>
      </div>
      <div class="shelf-alerts">
        <div 
          v-for="shelf in lowStockShelves" 
          :key="shelf.id" 
          class="shelf-alert"
        >
          <div class="alert-icon">
            <el-icon :size="16" color="#faad14"><Warning /></el-icon>
          </div>
          <div class="alert-info">
            <span class="alert-name">{{ shelf.ingredient }}</span>
            <span class="alert-stock">
              库存: {{ shelf.stock }}/{{ shelf.maxStock }} {{ shelf.unit }}
            </span>
          </div>
        </div>
        <div v-if="lowStockShelves.length === 0" class="no-alert">
          <el-icon :size="24" color="#52c41a"><CircleCheck /></el-icon>
          <span>库存充足，无预警</span>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-header">
        <el-icon :size="16" color="#722ed1"><Van /></el-icon>
        <span class="section-title">冷链车辆</span>
      </div>
      <div class="vehicle-list">
        <div 
          v-for="vehicle in vehicleData" 
          :key="vehicle.id" 
          class="vehicle-item"
          :class="{ warning: vehicle.temperature > -10 }"
        >
          <div class="vehicle-icon">
            <el-icon :size="18"><Van /></el-icon>
          </div>
          <div class="vehicle-info">
            <span class="vehicle-id">{{ vehicle.id }}</span>
            <span class="vehicle-status">{{ getStatusText(vehicle.status) }}</span>
          </div>
          <span class="vehicle-temp" :class="{ danger: vehicle.temperature > -10 }">
            {{ vehicle.temperature?.toFixed(1) }}°C
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  DataLine, HotWater, Cpu, WindPower, Loading,
  Tools, Box, Warning, CircleCheck, Van
} from '@element-plus/icons-vue'
import { inventoryManager } from '../managers/InventoryManager.js'

const props = defineProps({
  workstationData: {
    type: Array,
    default: () => []
  },
  shelfData: {
    type: Array,
    default: () => []
  },
  vehicleData: {
    type: Array,
    default: () => []
  },
  environmentData: {
    type: Object,
    default: () => ({})
  }
})

const lowStockShelves = computed(() => {
  return inventoryManager.checkLowStock()
})

const isTempWarning = computed(() => {
  const temp = props.environmentData.temperature
  return temp && (temp > 28 || temp < 16)
})

const isCo2Warning = computed(() => {
  const co2 = props.environmentData.co2
  return co2 && co2 > 1500
})

function getCapacityColor(rate) {
  if (rate > 80) return '#ff4d4f'
  if (rate > 60) return '#faad14'
  return '#52c41a'
}

function getStatusText(status) {
  const statusMap = {
    'idle': '待命',
    'delivering': '配送中',
    'maintenance': '维护中',
    'fault': '故障'
  }
  return statusMap[status] || status
}
</script>

<style scoped>
.info-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 80;
}

.panel-section {
  background: rgba(16, 32, 60, 0.95);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-radius: 8px;
  padding: 12px;
  backdrop-filter: blur(10px);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.env-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.env-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  gap: 6px;
}

.env-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.env-icon.temp {
  background: linear-gradient(135deg, #ff7a00, #ff4d4f);
}

.env-icon.humidity {
  background: linear-gradient(135deg, #1890ff, #096dd9);
}

.env-icon.co2 {
  background: linear-gradient(135deg, #52c41a, #389e0d);
}

.env-icon.co2.active {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.env-info {
  text-align: center;
}

.env-label {
  display: block;
  font-size: 11px;
  color: #8c8c8c;
  margin-bottom: 2px;
}

.env-value {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.env-value.warning {
  color: #faad14;
}

.env-value.danger {
  color: #ff4d4f;
}

.ventilation-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 10px;
  padding: 6px;
  background: rgba(82, 196, 26, 0.1);
  border-radius: 4px;
  font-size: 12px;
  color: #52c41a;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.workstation-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
}

.ws-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  transition: all 0.2s;
}

.ws-item:hover {
  background: rgba(24, 144, 255, 0.1);
}

.ws-item.fault {
  border-left: 3px solid #ff4d4f;
}

.ws-item.maintenance {
  border-left: 3px solid #faad14;
}

.ws-id {
  font-size: 12px;
  font-weight: 600;
  color: #1890ff;
  width: 40px;
}

.ws-info {
  flex: 1;
  min-width: 0;
}

.ws-dish {
  display: block;
  font-size: 12px;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ws-progress {
  margin-top: 4px;
}

.ws-rate {
  font-size: 12px;
  font-weight: 600;
  color: #52c41a;
  min-width: 40px;
  text-align: right;
}

.shelf-alerts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shelf-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(250, 173, 20, 0.1);
  border: 1px solid rgba(250, 173, 20, 0.3);
  border-radius: 6px;
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { box-shadow: 0 0 0 rgba(250, 173, 20, 0); }
  50% { box-shadow: 0 0 10px rgba(250, 173, 20, 0.5); }
}

.alert-icon {
  flex-shrink: 0;
}

.alert-info {
  flex: 1;
  min-width: 0;
}

.alert-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #faad14;
}

.alert-stock {
  font-size: 11px;
  color: #8c8c8c;
}

.no-alert {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px;
  color: #52c41a;
  font-size: 12px;
}

.vehicle-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vehicle-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
}

.vehicle-item.warning {
  border: 1px solid rgba(255, 77, 79, 0.5);
  background: rgba(255, 77, 79, 0.1);
}

.vehicle-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(114, 46, 209, 0.2);
  color: #722ed1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vehicle-info {
  flex: 1;
}

.vehicle-id {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.vehicle-status {
  font-size: 11px;
  color: #8c8c8c;
}

.vehicle-temp {
  font-size: 13px;
  font-weight: 600;
  color: #52c41a;
}

.vehicle-temp.danger {
  color: #ff4d4f;
}
</style>
