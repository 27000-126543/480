<template>
  <div class="app-container">
    <div id="canvas-container" ref="canvasContainer"></div>

    <LoginPanel v-if="!isLoggedIn" @login-success="handleLoginSuccess" />

    <template v-else>
      <TopHeader 
        :user="currentUser" 
        @logout="handleLogout"
        @toggle-sidebar="showSidebar = !showSidebar"
      />

      <ControlSidebar 
        v-model:visible="showSidebar" 
        :user="currentUser"
        @focus-area="handleFocusArea"
        @trigger-event="handleTriggerEvent"
        @export-report="handleExportReport"
        @update:showApproval="showApprovalPanel = $event"
        @update:showEquipment="showEquipmentPanel = $event"
      />

      <InfoPanel 
        :workstation-data="workstationData"
        :shelf-data="shelfData"
        :vehicle-data="vehicleData"
        :environment-data="environmentData"
      />

      <AlertNotifications :alerts="activeAlerts" />

      <WorkstationDetail 
        v-model:visible="showWorkstationDetail" 
        :data="selectedWorkstation"
      />

      <ShelfDetail 
        v-model:visible="showShelfDetail" 
        :data="selectedShelf"
        @create-replenishment="handleCreateReplenishment"
      />

      <VehicleDetail 
        v-model:visible="showVehicleDetail" 
        :data="selectedVehicle"
      />

      <ApprovalPanel 
        v-model:visible="showApprovalPanel"
        :user="currentUser"
      />

      <EquipmentPanel 
        v-model:visible="showEquipmentPanel"
        :user="currentUser"
      />
    </template>
  </div>
</template>

<script setup>import { ref, onMounted, onUnmounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { sceneManager } from './scene/SceneManager.js';
import { authManager } from './managers/AuthManager.js';
import { inventoryManager } from './managers/InventoryManager.js';
import { coldChainManager } from './managers/ColdChainManager.js';
import { equipmentManager } from './managers/EquipmentManager.js';
import { reportManager } from './managers/ReportManager.js';
import LoginPanel from './components/LoginPanel.vue';
import TopHeader from './components/TopHeader.vue';
import ControlSidebar from './components/ControlSidebar.vue';
import InfoPanel from './components/InfoPanel.vue';
import AlertNotifications from './components/AlertNotifications.vue';
import WorkstationDetail from './components/WorkstationDetail.vue';
import ShelfDetail from './components/ShelfDetail.vue';
import VehicleDetail from './components/VehicleDetail.vue';
import ApprovalPanel from './components/ApprovalPanel.vue';
import EquipmentPanel from './components/EquipmentPanel.vue';
const canvasContainer = ref(null);
const isLoggedIn = ref(false);
const currentUser = ref(null);
const showSidebar = ref(true);
const showWorkstationDetail = ref(false);
const showShelfDetail = ref(false);
const showVehicleDetail = ref(false);
const showApprovalPanel = ref(false);
const showEquipmentPanel = ref(false);
const selectedWorkstation = ref(null);
const selectedShelf = ref(null);
const selectedVehicle = ref(null);
const workstationData = ref([]);
const shelfData = ref([]);
const vehicleData = ref([]);
const environmentData = ref({
 temperature: 22,
 humidity: 55,
 co2: 800,
 newVentilationActive: false
});
const activeAlerts = ref([]);
let dataUpdateInterval = null;
onMounted(() => {
 initScene();
});
onUnmounted(() => {
 if (sceneManager) {
 sceneManager.dispose();
 }
 if (dataUpdateInterval) {
 clearInterval(dataUpdateInterval);
 }
});
function initScene() {
 sceneManager.init('canvas-container');
 sceneManager.onWorkstationClick = handleWorkstationClick;
 sceneManager.onShelfClick = handleShelfClick;
 sceneManager.onVehicleClick = handleVehicleClick;
}
function handleLoginSuccess(user) {
  isLoggedIn.value = true;
  currentUser.value = user;
  startDataUpdate();
  authManager.recordOperationLog('登录系统', '', 'success');
  ElMessage.success(`欢迎回来，${user.name}`);
}
function handleLogout() {
 authManager.logout();
 isLoggedIn.value = false;
 currentUser.value = null;
 stopDataUpdate();
 ElMessage.info('已退出登录');
}
function startDataUpdate() {
 updateData();
 dataUpdateInterval = setInterval(updateData, 2000);
}
function stopDataUpdate() {
 if (dataUpdateInterval) {
 clearInterval(dataUpdateInterval);
 dataUpdateInterval = null;
 }
}
function updateData() {
 workstationData.value = sceneManager.getWorkstationData();
 shelfData.value = sceneManager.getShelfData();
 vehicleData.value = sceneManager.getVehicleData();
 if (sceneManager.environmentSystem) {
 environmentData.value = sceneManager.environmentSystem.getSensorData();
 environmentData.value.newVentilationActive = sceneManager.environmentSystem.isNewVentilationActive();
 const alerts = sceneManager.environmentSystem.getAlerts();
 activeAlerts.value = alerts;
 }
}
function handleWorkstationClick(data) {
 selectedWorkstation.value = data;
 showWorkstationDetail.value = true;
 authManager.recordOperationLog('查看工位详情', data.id, 'success');
}
function handleShelfClick(data) {
 selectedShelf.value = data;
 showShelfDetail.value = true;
 authManager.recordOperationLog('查看货架详情', data.id, 'success');
}
function handleVehicleClick(data) {
 selectedVehicle.value = data;
 showVehicleDetail.value = true;
 authManager.recordOperationLog('查看配送车详情', data.id, 'success');
}
function handleFocusArea(areaName) {
 sceneManager.focusOnArea(areaName);
}
function handleTriggerEvent(eventType) {
 if (eventType === 'newVentilation') {
 sceneManager.startAirflow();
 sceneManager.triggerEnvironmentAlert('co2');
 ElMessage.warning('CO₂浓度超标，已启动新风系统');
 authManager.recordOperationLog('触发环境预警', 'CO₂超标', 'success');
 }
 else if (eventType === 'simulateFault') {
 ElMessage.info('设备故障模拟功能');
 }
}
function handleExportReport(date) {
  const reportDate = date ? new Date(date) : new Date()
  const report = reportManager.generateDailyReport(reportDate)
  const result = reportManager.exportToExcel(report)
  if (result.success) {
    ElMessage.success(`报表已导出: ${result.filename}`)
    authManager.recordOperationLog('导出生产日报', result.filename, 'success')
  }
}
function handleCreateReplenishment(shelfId, quantity) {
 const request = inventoryManager.createReplenishmentRequest(shelfId, quantity);
 if (request) {
 ElMessage.success(`补货申请已创建: ${request.id}`);
 authManager.recordOperationLog('创建补货申请', request.id, 'success');
 }
}
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #0a1628;
}

#canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>
