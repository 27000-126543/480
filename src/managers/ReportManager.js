import * as XLSX from 'xlsx'
import { schedulingManager } from './SchedulingManager.js'
import { inventoryManager } from './InventoryManager.js'
import { equipmentManager } from './EquipmentManager.js'
import { coldChainManager } from './ColdChainManager.js'

class ReportManager {
  constructor() {
    this.reportTemplates = [
      { id: 'daily', name: '生产日报', description: '每日生产统计报表' },
      { id: 'weekly', name: '生产周报', description: '每周生产统计报表' },
      { id: 'monthly', name: '生产月报', description: '每月生产统计报表' }
    ]
  }

  generateDailyReport(date = new Date()) {
    const reportDate = new Date(date)
    const dateStr = this.formatDate(reportDate)

    const workstationStats = this.generateWorkstationStats()
    const inventoryStats = this.generateInventoryStats()
    const equipmentStats = this.generateEquipmentStats()
    const deliveryStats = this.generateDeliveryStats()
    const orderStats = this.generateOrderStats()

    return {
      reportDate: dateStr,
      generatedAt: new Date(),
      workstationStats,
      inventoryStats,
      equipmentStats,
      deliveryStats,
      orderStats,
      summary: this.generateSummary(workstationStats, inventoryStats, equipmentStats, deliveryStats, orderStats)
    }
  }

  generateWorkstationStats() {
    const workstations = schedulingManager.getWorkstationStats()
    return workstations.map(ws => ({
      id: ws.id,
      area: this.getWorkstationArea(ws.id),
      todayOutput: ws.todayOutput,
      todayTarget: ws.todayTarget,
      completionRate: ((ws.todayOutput / ws.todayTarget) * 100).toFixed(2),
      ordersProcessed: ws.ordersProcessed,
      efficiency: ws.efficiency,
      avgCapacity: ws.currentLoad || 0,
      runtime: 8 + Math.random() * 2,
      status: ws.status || 'running'
    }))
  }

  getWorkstationArea(wsId) {
    const areaMap = {
      'W001': '初加工间',
      'W002': '初加工间',
      'W003': '初加工间',
      'W004': '热厨区',
      'W005': '热厨区',
      'W006': '热厨区',
      'W007': '热厨区',
      'W008': '包装区',
      'W009': '包装区',
      'W010': '包装区',
      'W011': '包装区'
    }
    return areaMap[wsId] || '未知区域'
  }

  generateInventoryStats() {
    const inventory = inventoryManager.getAllInventory()
    return inventory.map(item => ({
      id: item.id,
      ingredient: item.ingredient,
      startStock: item.maxStock * 0.6,
      endStock: item.stock,
      consumed: item.maxStock * 0.6 - item.stock + Math.random() * 50,
      replenished: Math.random() > 0.5 ? Math.floor(100 + Math.random() * 200) : 0,
      maxStock: item.maxStock,
      threshold: item.threshold,
      unit: item.unit,
      isLowStock: item.stock < item.threshold
    }))
  }

  generateEquipmentStats() {
    const stats = equipmentManager.getEquipmentStats()
    const equipments = equipmentManager.equipment
    const faultCount = equipments.filter(e => e.status === 'fault').length
    const maintenanceCount = equipments.filter(e => e.status === 'maintenance').length
    
    return {
      total: stats.total,
      running: stats.running,
      fault: faultCount,
      maintenance: maintenanceCount,
      availabilityRate: stats.availabilityRate,
      faultRecords: equipmentManager.faultHistory.slice(0, 10),
      workOrders: equipmentManager.workOrders.slice(0, 10)
    }
  }

  generateDeliveryStats() {
    const stats = coldChainManager.getDeliveryStatistics()
    const vehicles = coldChainManager.getVehicleStats()
    const anomalies = coldChainManager.anomalies.slice(0, 10)

    return {
      totalDeliveries: stats.total,
      completed: stats.completed,
      inTransit: stats.inTransit,
      onTimeRate: stats.onTimeRate,
      vehicles,
      anomalies,
      anomalyCount: anomalies.filter(a => a.status === 'open').length
    }
  }

  generateOrderStats() {
    const orders = schedulingManager.orders
    const completed = orders.filter(o => o.status === 'completed')
    const processing = orders.filter(o => o.status === 'processing')
    const pending = orders.filter(o => o.status === 'pending')

    return {
      total: orders.length,
      pending: pending.length,
      processing: processing.length,
      completed: completed.length,
      completionRate: ((completed.length / orders.length) * 100).toFixed(2),
      totalQuantity: orders.reduce((sum, o) => sum + o.quantity, 0),
      completedQuantity: completed.reduce((sum, o) => sum + o.quantity, 0)
    }
  }

  generateSummary(wsStats, invStats, eqStats, delStats, ordStats) {
    const totalOutput = wsStats.reduce((sum, ws) => sum + ws.todayOutput, 0)
    const totalTarget = wsStats.reduce((sum, ws) => sum + ws.todayTarget, 0)
    const lowStockItems = invStats.filter(i => i.isLowStock).length

    return {
      totalOutput,
      totalTarget,
      overallCompletionRate: ((totalOutput / totalTarget) * 100).toFixed(2),
      lowStockItems,
      equipmentFaults: eqStats.fault,
      deliveryOnTimeRate: delStats.onTimeRate,
      orderCompletionRate: ordStats.completionRate
    }
  }

  exportToExcel(reportData, filename) {
    const wb = XLSX.utils.book_new()

    const summaryData = [
      ['生产日报', reportData.reportDate],
      [],
      ['指标', '数值', '单位'],
      ['总产量', reportData.summary.totalOutput, '份'],
      ['目标产量', reportData.summary.totalTarget, '份'],
      ['整体完成率', reportData.summary.overallCompletionRate + '%', ''],
      ['库存预警项数', reportData.summary.lowStockItems, '项'],
      ['设备故障数', reportData.summary.equipmentFaults, '台'],
      ['配送准点率', reportData.summary.deliveryOnTimeRate + '%', ''],
      ['订单完成率', reportData.summary.orderCompletionRate + '%', '']
    ]
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, wsSummary, '汇总')

    const wsHeader = ['工位编号', '所属区域', '今日产量', '目标产量', '完成率(%)', '处理订单数', '运行时间(h)', '状态']
    const wsData = reportData.workstationStats.map(ws => [
      ws.id,
      ws.area,
      ws.todayOutput,
      ws.todayTarget,
      ws.completionRate,
      ws.ordersProcessed,
      ws.runtime.toFixed(1),
      ws.status
    ])
    wsData.unshift(wsHeader)
    const wsWorkstations = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, wsWorkstations, '工位产量')

    const invHeader = ['货架编号', '食材名称', '期初库存', '期末库存', '消耗量', '补货量', '最大库存', '安全阈值', '单位', '库存预警']
    const invData = reportData.inventoryStats.map(item => [
      item.id,
      item.ingredient,
      item.startStock.toFixed(0),
      item.endStock,
      item.consumed.toFixed(0),
      item.replenished,
      item.maxStock,
      item.threshold,
      item.unit,
      item.isLowStock ? '是' : '否'
    ])
    invData.unshift(invHeader)
    const wsInventory = XLSX.utils.aoa_to_sheet(invData)
    XLSX.utils.book_append_sheet(wb, wsInventory, '食材消耗')

    const eqHeader = ['设备编号', '设备名称', '类型', '状态', '故障次数', '效率(%)', '上次维护']
    const eqData = equipmentManager.equipment.map(eq => [
      eq.id,
      eq.name,
      eq.type,
      eq.status,
      eq.faultCount,
      eq.efficiency.toFixed(1),
      this.formatDate(eq.lastMaintenance)
    ])
    eqData.unshift(eqHeader)
    const wsEquipment = XLSX.utils.aoa_to_sheet(eqData)
    XLSX.utils.book_append_sheet(wb, wsEquipment, '设备故障')

    const delHeader = ['车辆编号', '车牌号', '状态', '当前温度(°C)', '载重(kg)', '载重率(%)']
    const delData = reportData.deliveryStats.vehicles.map(v => [
      v.id,
      coldChainManager.getVehicleById(v.id)?.plateNumber || '',
      v.status,
      v.temperature.toFixed(1),
      v.load,
      v.loadRate
    ])
    delData.unshift(delHeader)
    const wsDelivery = XLSX.utils.aoa_to_sheet(delData)
    XLSX.utils.book_append_sheet(wb, wsDelivery, '配送准点率')

    const exportName = filename || `生产日报_${reportData.reportDate}.xlsx`
    XLSX.writeFile(wb, exportName)

    return { success: true, filename: exportName }
  }

  formatDate(date) {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  getReportTemplates() {
    return [...this.reportTemplates]
  }

  getAvailableDates(days = 30) {
    const dates = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(this.formatDate(date))
    }
    return dates
  }
}

export const reportManager = new ReportManager()
