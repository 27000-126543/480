import { reactive } from 'vue'

class InventoryManager {
  constructor() {
    this.inventory = reactive([])
    this.replenishmentRequests = reactive([])
    this.approvalHistory = reactive([])
    this.initMockData()
  }

  initMockData() {
    const ingredients = [
      { id: 'S001', ingredient: '猪肉', stock: 150, maxStock: 500, threshold: 100, unit: 'kg' },
      { id: 'S002', ingredient: '鸡肉', stock: 80, maxStock: 400, threshold: 80, unit: 'kg' },
      { id: 'S003', ingredient: '牛肉', stock: 200, maxStock: 300, threshold: 60, unit: 'kg' },
      { id: 'S004', ingredient: '蔬菜', stock: 300, maxStock: 600, threshold: 150, unit: 'kg' },
      { id: 'S005', ingredient: '水产', stock: 45, maxStock: 200, threshold: 50, unit: 'kg' },
      { id: 'S006', ingredient: '米面', stock: 400, maxStock: 800, threshold: 200, unit: 'kg' },
      { id: 'S007', ingredient: '调料', stock: 120, maxStock: 300, threshold: 60, unit: 'kg' },
      { id: 'S008', ingredient: '食用油', stock: 90, maxStock: 200, threshold: 50, unit: 'L' }
    ]

    ingredients.forEach(item => {
      this.inventory.push({
        ...item,
        lastUpdated: new Date(Date.now() - Math.random() * 86400000),
        supplier: `供应商${Math.floor(Math.random() * 10) + 1}`,
        expiryDate: new Date(Date.now() + 86400000 * (30 + Math.random() * 60))
      })
    })

    this.replenishmentRequests.push({
      id: 'REQ001',
      ingredient: '鸡肉',
      shelfId: 'S002',
      requestedQuantity: 200,
      currentStock: 80,
      maxStock: 400,
      unit: 'kg',
      status: 'pending_warehouse',
      priority: 'high',
      createdAt: new Date(Date.now() - 3600000),
      approvalFlow: [
        { role: 'warehouse', status: 'pending', approver: null, comment: null, time: null },
        { role: 'quality', status: 'pending', approver: null, comment: null, time: null },
        { role: 'director', status: 'pending', approver: null, comment: null, time: null }
      ]
    })

    this.replenishmentRequests.push({
      id: 'REQ002',
      ingredient: '水产',
      shelfId: 'S005',
      requestedQuantity: 100,
      currentStock: 45,
      maxStock: 200,
      unit: 'kg',
      status: 'pending_quality',
      priority: 'urgent',
      createdAt: new Date(Date.now() - 7200000),
      approvalFlow: [
        { role: 'warehouse', status: 'approved', approver: '仓管员A', comment: '库存紧张，同意补货', time: new Date(Date.now() - 5400000) },
        { role: 'quality', status: 'pending', approver: null, comment: null, time: null },
        { role: 'director', status: 'pending', approver: null, comment: null, time: null }
      ]
    })
  }

  checkLowStock() {
    return this.inventory.filter(item => item.stock < item.threshold)
  }

  createReplenishmentRequest(shelfId, quantity) {
    const item = this.inventory.find(i => i.id === shelfId)
    if (!item) return null

    const request = {
      id: `REQ${String(this.replenishmentRequests.length + 1).padStart(3, '0')}`,
      ingredient: item.ingredient,
      shelfId,
      requestedQuantity: quantity,
      currentStock: item.stock,
      maxStock: item.maxStock,
      unit: item.unit,
      status: 'pending_warehouse',
      priority: item.stock < item.threshold * 0.5 ? 'urgent' : 'high',
      createdAt: new Date(),
      approvalFlow: [
        { role: 'warehouse', status: 'pending', approver: null, comment: null, time: null },
        { role: 'quality', status: 'pending', approver: null, comment: null, time: null },
        { role: 'director', status: 'pending', approver: null, comment: null, time: null }
      ]
    }

    this.replenishmentRequests.push(request)
    return request
  }

  approveRequest(requestId, role, approver, comment = '') {
    const request = this.replenishmentRequests.find(r => r.id === requestId)
    if (!request) return false

    const roleMap = {
      'warehouse': 0,
      'quality': 1,
      'director': 2
    }

    const stepIndex = roleMap[role]
    if (stepIndex === undefined) return false

    const currentStep = request.approvalFlow[stepIndex]
    if (currentStep.status !== 'pending') return false

    currentStep.status = 'approved'
    currentStep.approver = approver
    currentStep.comment = comment
    currentStep.time = new Date()

    if (stepIndex < 2) {
      const nextStep = request.approvalFlow[stepIndex + 1]
      request.status = `pending_${nextStep.role}`
    } else {
      request.status = 'approved'
      this.updateStock(request.shelfId, request.requestedQuantity)
      this.createDelivery(request)
    }

    this.approvalHistory.push({
      requestId,
      role,
      approver,
      comment,
      result: 'approved',
      time: new Date()
    })

    return true
  }

  rejectRequest(requestId, role, approver, reason) {
    const request = this.replenishmentRequests.find(r => r.id === requestId)
    if (!request) return false

    const roleMap = {
      'warehouse': 0,
      'quality': 1,
      'director': 2
    }

    const stepIndex = roleMap[role]
    if (stepIndex === undefined) return false

    const currentStep = request.approvalFlow[stepIndex]
    currentStep.status = 'rejected'
    currentStep.approver = approver
    currentStep.comment = reason
    currentStep.time = new Date()

    request.status = 'rejected'

    this.approvalHistory.push({
      requestId,
      role,
      approver,
      comment: reason,
      result: 'rejected',
      time: new Date()
    })

    return true
  }

  updateStock(shelfId, quantity) {
    const item = this.inventory.find(i => i.id === shelfId)
    if (item) {
      item.stock = Math.min(item.maxStock, item.stock + quantity)
      item.lastUpdated = new Date()
    }
  }

  consumeStock(shelfId, quantity) {
    const item = this.inventory.find(i => i.id === shelfId)
    if (item && item.stock >= quantity) {
      item.stock -= quantity
      item.lastUpdated = new Date()

      if (item.stock < item.threshold) {
        if (!this.replenishmentRequests.some(r => r.shelfId === shelfId && r.status !== 'completed' && r.status !== 'rejected')) {
          this.createReplenishmentRequest(shelfId, item.maxStock - item.stock)
        }
      }
      return true
    }
    return false
  }

  createDelivery(request) {
    const delivery = {
      id: `DEL${String(Date.now()).slice(-6)}`,
      requestId: request.id,
      ingredient: request.ingredient,
      quantity: request.requestedQuantity,
      unit: request.unit,
      status: 'scheduled',
      vehicleId: null,
      estimatedDelivery: new Date(Date.now() + 7200000),
      route: this.generateDeliveryRoute()
    }
    return delivery
  }

  generateDeliveryRoute() {
    return [
      { x: -5, z: 13 },
      { x: -15, z: 13 },
      { x: -15, z: 5 },
      { x: -28, z: 5 },
      { x: -28, z: -15 },
      { x: -20, z: -15 }
    ]
  }

  getPendingRequests() {
    return this.replenishmentRequests.filter(r => !r.status.includes('approved') && r.status !== 'rejected' && r.status !== 'completed')
  }

  getRequestsByRole(role) {
    const roleStatusMap = {
      'warehouse': 'pending_warehouse',
      'quality': 'pending_quality',
      'director': 'pending_director'
    }
    const status = roleStatusMap[role]
    return status ? this.replenishmentRequests.filter(r => r.status === status) : []
  }

  getInventoryItem(shelfId) {
    return this.inventory.find(i => i.id === shelfId)
  }

  getAllInventory() {
    return [...this.inventory]
  }
}

export const inventoryManager = new InventoryManager()
