import { reactive } from 'vue'

class EquipmentManager {
  constructor() {
    this.equipment = reactive([])
    this.workOrders = reactive([])
    this.faultHistory = reactive([])
    this.maintenanceRecords = reactive([])
    this.initMockData()
  }

  initMockData() {
    const equipmentTypes = [
      { type: '切菜机', model: 'QCJ-200', area: '初加工间' },
      { type: '削皮机', model: 'XPJ-150', area: '初加工间' },
      { type: '清洗机', model: 'QXJ-300', area: '初加工间' },
      { type: '炒炉', model: 'CL-500', area: '热厨区' },
      { type: '蒸箱', model: 'ZX-400', area: '热厨区' },
      { type: '汤锅', model: 'TG-300', area: '热厨区' },
      { type: '包装机', model: 'BZJ-200', area: '包装区' },
      { type: '打码机', model: 'DMJ-100', area: '包装区' },
      { type: '贴标机', model: 'TBJ-150', area: '包装区' }
    ]

    for (let i = 1; i <= 11; i++) {
      const typeInfo = equipmentTypes[Math.min(Math.floor((i - 1) / 2), equipmentTypes.length - 1)]
      this.equipment.push({
        id: `EQ${String(i).padStart(3, '0')}`,
        workstationId: `W00${i}`,
        name: `${typeInfo.type}-${i}`,
        type: typeInfo.type,
        model: typeInfo.model,
        area: typeInfo.area,
        status: i === 5 ? 'fault' : i === 3 ? 'maintenance' : 'running',
        runtime: 1000 + Math.random() * 5000,
        lastMaintenance: new Date(Date.now() - 86400000 * (15 + Math.random() * 30)),
        nextMaintenance: new Date(Date.now() + 86400000 * (15 + Math.random() * 30)),
        faultCount: Math.floor(Math.random() * 5),
        efficiency: 85 + Math.random() * 15,
        specifications: {
          power: `${1.5 + Math.random() * 3}kW`,
          voltage: '380V',
          weight: `${100 + Math.random() * 200}kg`
        },
        lockReason: i === 5 ? '电机过热，需要更换轴承' : null
      })
    }

    this.workOrders.push({
      id: 'WO001',
      equipmentId: 'EQ005',
      workstationId: 'W005',
      type: 'fault',
      title: '炒炉电机故障',
      description: '炒炉运行时发出异常噪音，电机温度过高',
      priority: 'high',
      status: 'assigned',
      assignee: '维修工程师-王工',
      assigneePhone: '138****8888',
      createdAt: new Date(Date.now() - 3600000 * 2),
      estimatedTime: 120,
      beforePhotos: [],
      afterPhotos: [],
      partsNeeded: ['电机轴承', '润滑油'],
      resolution: null
    })

    this.workOrders.push({
      id: 'WO002',
      equipmentId: 'EQ003',
      workstationId: 'W003',
      type: 'preventive',
      title: '常规设备维护',
      description: '季度设备检查、清洁和润滑',
      priority: 'medium',
      status: 'in_progress',
      assignee: '维修工程师-李工',
      assigneePhone: '139****9999',
      createdAt: new Date(Date.now() - 3600000),
      estimatedTime: 60,
      beforePhotos: [],
      afterPhotos: [],
      partsNeeded: ['清洁液', '润滑油'],
      resolution: null
    })

    this.faultHistory.push({
      id: 'FH001',
      equipmentId: 'EQ002',
      faultType: '机械故障',
      description: '刀片磨损，需要更换',
      occurredAt: new Date(Date.now() - 86400000 * 5),
      resolvedAt: new Date(Date.now() - 86400000 * 5 + 3600000 * 2),
      resolution: '更换新刀片',
      downtime: 2,
      cost: 500
    })
  }

  reportFault(equipmentId, title, description, reporter) {
    const equipment = this.equipment.find(e => e.id === equipmentId)
    if (!equipment) return null

    equipment.status = 'fault'
    equipment.lockReason = description

    const workOrder = {
      id: `WO${String(this.workOrders.length + 1).padStart(3, '0')}`,
      equipmentId,
      workstationId: equipment.workstationId,
      type: 'fault',
      title,
      description,
      priority: 'high',
      status: 'pending',
      reporter,
      assignee: null,
      assigneePhone: null,
      createdAt: new Date(),
      estimatedTime: 0,
      beforePhotos: [],
      afterPhotos: [],
      partsNeeded: [],
      resolution: null
    }

    this.workOrders.push(workOrder)
    return workOrder
  }

  assignWorkOrder(workOrderId, assignee, assigneePhone, estimatedTime) {
    const workOrder = this.workOrders.find(w => w.id === workOrderId)
    if (workOrder) {
      workOrder.assignee = assignee
      workOrder.assigneePhone = assigneePhone
      workOrder.estimatedTime = estimatedTime
      workOrder.status = 'assigned'
      return true
    }
    return false
  }

  startWorkOrder(workOrderId) {
    const workOrder = this.workOrders.find(w => w.id === workOrderId)
    if (workOrder) {
      workOrder.status = 'in_progress'
      workOrder.startedAt = new Date()
      return true
    }
    return false
  }

  completeWorkOrder(workOrderId, resolution, beforePhotos, afterPhotos) {
    const workOrder = this.workOrders.find(w => w.id === workOrderId)
    if (workOrder) {
      workOrder.status = 'completed'
      workOrder.completedAt = new Date()
      workOrder.resolution = resolution
      workOrder.beforePhotos = beforePhotos || []
      workOrder.afterPhotos = afterPhotos || []

      const equipment = this.equipment.find(e => e.id === workOrder.equipmentId)
      if (equipment) {
        equipment.status = 'running'
        equipment.lockReason = null
        equipment.lastMaintenance = new Date()
      }

      if (workOrder.type === 'fault') {
        this.faultHistory.push({
          id: `FH${String(this.faultHistory.length + 1).padStart(3, '0')}`,
          equipmentId: workOrder.equipmentId,
          faultType: workOrder.title,
          description: workOrder.description,
          occurredAt: workOrder.createdAt,
          resolvedAt: workOrder.completedAt,
          resolution,
          downtime: (workOrder.completedAt - workOrder.createdAt) / 3600000,
          cost: 0
        })
      }

      this.maintenanceRecords.push({
        id: `MR${String(this.maintenanceRecords.length + 1).padStart(4, '0')}`,
        equipmentId: workOrder.equipmentId,
        type: workOrder.type,
        workOrderId,
        performedBy: workOrder.assignee,
        performedAt: workOrder.completedAt,
        resolution,
        beforePhotos: workOrder.beforePhotos,
        afterPhotos: workOrder.afterPhotos
      })

      return true
    }
    return false
  }

  lockEquipment(equipmentId, reason) {
    const equipment = this.equipment.find(e => e.id === equipmentId)
    if (equipment) {
      equipment.status = 'locked'
      equipment.lockReason = reason
      return true
    }
    return false
  }

  unlockEquipment(equipmentId) {
    const equipment = this.equipment.find(e => e.id === equipmentId)
    if (equipment) {
      equipment.status = 'running'
      equipment.lockReason = null
      return true
    }
    return false
  }

  getEquipmentByWorkstation(workstationId) {
    return this.equipment.find(e => e.workstationId === workstationId)
  }

  getFaultyEquipment() {
    return this.equipment.filter(e => e.status === 'fault' || e.status === 'locked')
  }

  getPendingWorkOrders() {
    return this.workOrders.filter(w => w.status === 'pending' || w.status === 'assigned')
  }

  getActiveWorkOrders() {
    return this.workOrders.filter(w => w.status === 'in_progress')
  }

  getEquipmentStats() {
    const total = this.equipment.length
    const running = this.equipment.filter(e => e.status === 'running').length
    const fault = this.equipment.filter(e => e.status === 'fault').length
    const maintenance = this.equipment.filter(e => e.status === 'maintenance').length
    const locked = this.equipment.filter(e => e.status === 'locked').length

    return {
      total,
      running,
      fault,
      maintenance,
      locked,
      availabilityRate: ((running / total) * 100).toFixed(1)
    }
  }

  getMaintenanceDue() {
    const now = Date.now()
    return this.equipment.filter(e => e.nextMaintenance.getTime() - now < 86400000 * 7)
  }
}

export const equipmentManager = new EquipmentManager()
