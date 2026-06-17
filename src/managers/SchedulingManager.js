import { reactive } from 'vue'

class SchedulingManager {
  constructor() {
    this.orders = reactive([])
    this.workstationLoads = reactive({})
    this.maintenanceSchedule = reactive([])
    this.orderHistory = reactive([])
    this.initMockData()
  }

  initMockData() {
    const dishes = ['红烧肉', '清蒸鱼', '宫保鸡丁', '麻婆豆腐', '糖醋排骨', '西红柿炒蛋', '青椒肉丝', '鱼香茄子', '回锅肉', '水煮鱼']
    const priorities = ['high', 'medium', 'low']
    const statuses = ['pending', 'processing', 'completed']

    for (let i = 1; i <= 20; i++) {
      const deliveryTime = new Date(Date.now() + Math.random() * 86400000 * 3)
      this.orders.push({
        id: `ORD${String(i).padStart(5, '0')}`,
        dish: dishes[Math.floor(Math.random() * dishes.length)],
        quantity: Math.floor(50 + Math.random() * 200),
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        deliveryTime,
        assignedWorkstation: null,
        progress: Math.random() * 100,
        createdAt: new Date(Date.now() - Math.random() * 86400000),
        customer: `客户${Math.floor(Math.random() * 100)}`
      })
    }

    for (let i = 1; i <= 11; i++) {
      this.workstationLoads[`W00${i}`] = {
        currentLoad: 30 + Math.random() * 60,
        todayOutput: Math.floor(500 + Math.random() * 1000),
        todayTarget: 1500,
        ordersProcessed: Math.floor(10 + Math.random() * 30)
      }
    }

    this.maintenanceSchedule.push({
      id: 'MT001',
      workstationId: 'W004',
      type: 'preventive',
      scheduledTime: new Date(Date.now() + 3600000 * 2),
      duration: 30,
      status: 'scheduled',
      description: '常规设备检查与清洁'
    })
  }

  assignOptimalWorkstation(order) {
    const workstationTypes = {
      '初加工间': ['W001', 'W002', 'W003'],
      '热厨区': ['W004', 'W005', 'W006', 'W007'],
      '包装区': ['W008', 'W009', 'W010', 'W011']
    }

    let availableWorkstations = []
    Object.values(workstationTypes).forEach(ids => {
      availableWorkstations = availableWorkstations.concat(ids)
    })

    let bestWorkstation = null
    let bestScore = Infinity

    availableWorkstations.forEach(wsId => {
      const load = this.workstationLoads[wsId]
      if (!load) return

      const priorityWeight = order.priority === 'high' ? 2 : order.priority === 'medium' ? 1.5 : 1
      const timeWeight = this.calculateTimeWeight(order.deliveryTime)
      const loadWeight = load.currentLoad / 100

      const score = (loadWeight * 0.5 + timeWeight * 0.3) / priorityWeight

      if (score < bestScore) {
        bestScore = score
        bestWorkstation = wsId
      }
    })

    if (bestWorkstation) {
      order.assignedWorkstation = bestWorkstation
      order.status = 'processing'
      this.workstationLoads[bestWorkstation].currentLoad += 10
      this.workstationLoads[bestWorkstation].ordersProcessed++
    }

    return bestWorkstation
  }

  calculateTimeWeight(deliveryTime) {
    const now = Date.now()
    const timeToDelivery = deliveryTime.getTime() - now
    if (timeToDelivery < 3600000) return 3
    if (timeToDelivery < 7200000) return 2
    if (timeToDelivery < 14400000) return 1.5
    return 1
  }

  checkAndScheduleMaintenance(workstationId, runtime) {
    if (runtime > 4 && !this.isMaintenanceScheduled(workstationId)) {
      const maintenance = {
        id: `MT${String(this.maintenanceSchedule.length + 1).padStart(3, '0')}`,
        workstationId,
        type: 'scheduled',
        scheduledTime: new Date(Date.now() + 60000),
        duration: 30,
        status: 'scheduled',
        description: '连续运行超过4小时，自动安排维护'
      }
      this.maintenanceSchedule.push(maintenance)
      return maintenance
    }
    return null
  }

  isMaintenanceScheduled(workstationId) {
    return this.maintenanceSchedule.some(
      m => m.workstationId === workstationId && m.status !== 'completed'
    )
  }

  completeMaintenance(maintenanceId) {
    const maintenance = this.maintenanceSchedule.find(m => m.id === maintenanceId)
    if (maintenance) {
      maintenance.status = 'completed'
      maintenance.completedAt = new Date()
      if (this.workstationLoads[maintenance.workstationId]) {
        this.workstationLoads[maintenance.workstationId].currentLoad = Math.max(0, this.workstationLoads[maintenance.workstationId].currentLoad - 20)
      }
    }
  }

  getPendingOrders() {
    return this.orders.filter(o => o.status === 'pending')
  }

  getProcessingOrders() {
    return this.orders.filter(o => o.status === 'processing')
  }

  getCompletedOrders() {
    return this.orders.filter(o => o.status === 'completed')
  }

  getWorkstationLoad(workstationId) {
    return this.workstationLoads[workstationId] || null
  }

  getWorkstationStats() {
    return Object.entries(this.workstationLoads).map(([id, load]) => ({
      id,
      ...load,
      efficiency: ((load.todayOutput / load.todayTarget) * 100).toFixed(1)
    }))
  }

  updateOrderProgress(orderId, progress) {
    const order = this.orders.find(o => o.id === orderId)
    if (order) {
      order.progress = progress
      if (progress >= 100) {
        order.status = 'completed'
        order.completedAt = new Date()
        if (order.assignedWorkstation && this.workstationLoads[order.assignedWorkstation]) {
          this.workstationLoads[order.assignedWorkstation].currentLoad = Math.max(0, this.workstationLoads[order.assignedWorkstation].currentLoad - 10)
          this.workstationLoads[order.assignedWorkstation].todayOutput += order.quantity
        }
      }
    }
  }
}

export const schedulingManager = new SchedulingManager()
