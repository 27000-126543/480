import { reactive } from 'vue'

class ColdChainManager {
  constructor() {
    this.vehicles = reactive([])
    this.deliveries = reactive([])
    this.anomalies = reactive([])
    this.temperatureLogs = reactive({})
    this.initMockData()
  }

  initMockData() {
    this.vehicles.push(
      {
        id: 'V001',
        plateNumber: '京A·12345',
        model: '冷链运输车-中型',
        capacity: 5000,
        currentLoad: 0,
        temperature: -18,
        targetTemperature: -18,
        minTemperature: -25,
        maxTemperature: -10,
        status: 'idle',
        location: { x: -10, z: 10 },
        currentRoute: null,
        routeProgress: 0,
        backupCoolingActive: false,
        driver: '张师傅',
        phone: '138****1234',
        lastMaintenance: new Date(Date.now() - 86400000 * 7),
        nextMaintenance: new Date(Date.now() + 86400000 * 23)
      },
      {
        id: 'V002',
        plateNumber: '京A·67890',
        model: '冷链运输车-大型',
        capacity: 8000,
        currentLoad: 3500,
        temperature: -20,
        targetTemperature: -18,
        minTemperature: -25,
        maxTemperature: -10,
        status: 'delivering',
        location: { x: -5, z: 13 },
        currentRoute: 'ROUTE001',
        routeProgress: 0.3,
        backupCoolingActive: false,
        driver: '李师傅',
        phone: '139****5678',
        lastMaintenance: new Date(Date.now() - 86400000 * 10),
        nextMaintenance: new Date(Date.now() + 86400000 * 20),
        currentDelivery: 'DEL001'
      },
      {
        id: 'V003',
        plateNumber: '京A·11111',
        model: '冷链运输车-小型',
        capacity: 3000,
        currentLoad: 0,
        temperature: -15,
        targetTemperature: -18,
        minTemperature: -25,
        maxTemperature: -10,
        status: 'idle',
        location: { x: 0, z: 10 },
        currentRoute: null,
        routeProgress: 0,
        backupCoolingActive: false,
        driver: '王师傅',
        phone: '137****9012',
        lastMaintenance: new Date(Date.now() - 86400000 * 3),
        nextMaintenance: new Date(Date.now() + 86400000 * 27)
      }
    )

    this.deliveries.push({
      id: 'DEL001',
      vehicleId: 'V002',
      orderId: 'ORD00015',
      items: [
        { ingredient: '猪肉', quantity: 1500, unit: 'kg' },
        { ingredient: '鸡肉', quantity: 2000, unit: 'kg' }
      ],
      destination: '朝阳区配送中心',
      departureTime: new Date(Date.now() - 3600000),
      estimatedArrival: new Date(Date.now() + 3600000),
      status: 'in_transit',
      temperatureLog: []
    })

    this.deliveries.push({
      id: 'DEL002',
      vehicleId: 'V001',
      orderId: 'ORD00012',
      items: [
        { ingredient: '水产', quantity: 800, unit: 'kg' }
      ],
      destination: '海淀区配送中心',
      departureTime: new Date(Date.now() - 86400000),
      estimatedArrival: new Date(Date.now() - 82800000),
      actualArrival: new Date(Date.now() - 83000000),
      status: 'completed',
      onTime: true,
      temperatureLog: []
    })
  }

  updateVehicleTemperature(vehicleId, temperature) {
    const vehicle = this.vehicles.find(v => v.id === vehicleId)
    if (!vehicle) return

    vehicle.temperature = temperature

    if (!this.temperatureLogs[vehicleId]) {
      this.temperatureLogs[vehicleId] = []
    }
    this.temperatureLogs[vehicleId].push({
      time: new Date(),
      temperature
    })

    if (this.temperatureLogs[vehicleId].length > 100) {
      this.temperatureLogs[vehicleId].shift()
    }

    if (temperature > vehicle.maxTemperature) {
      if (!vehicle.backupCoolingActive) {
        this.activateBackupCooling(vehicleId)
      }
      this.createAnomaly(vehicleId, 'temperature_high', `温度超标: ${temperature.toFixed(1)}°C`)
    } else if (temperature < vehicle.minTemperature) {
      this.createAnomaly(vehicleId, 'temperature_low', `温度过低: ${temperature.toFixed(1)}°C`)
    } else if (vehicle.backupCoolingActive && temperature <= vehicle.targetTemperature) {
      vehicle.backupCoolingActive = false
    }
  }

  activateBackupCooling(vehicleId) {
    const vehicle = this.vehicles.find(v => v.id === vehicleId)
    if (vehicle) {
      vehicle.backupCoolingActive = true
      this.createAnomaly(vehicleId, 'backup_cooling', '备用制冷系统已启动')
    }
  }

  createAnomaly(vehicleId, type, message) {
    const anomaly = {
      id: `ANOM${String(this.anomalies.length + 1).padStart(4, '0')}`,
      vehicleId,
      type,
      message,
      level: type === 'temperature_high' ? 'danger' : 'warning',
      timestamp: new Date(),
      status: 'open',
      handledBy: null,
      handledTime: null,
      resolution: null
    }
    this.anomalies.push(anomaly)
    return anomaly
  }

  handleAnomaly(anomalyId, handler, resolution) {
    const anomaly = this.anomalies.find(a => a.id === anomalyId)
    if (anomaly) {
      anomaly.status = 'handled'
      anomaly.handledBy = handler
      anomaly.handledTime = new Date()
      anomaly.resolution = resolution
    }
  }

  assignDelivery(vehicleId, delivery) {
    const vehicle = this.vehicles.find(v => v.id === vehicleId)
    if (vehicle && vehicle.status === 'idle') {
      vehicle.status = 'delivering'
      vehicle.currentDelivery = delivery.id
      vehicle.currentLoad = delivery.items.reduce((sum, item) => sum + item.quantity, 0)
      delivery.vehicleId = vehicleId
      delivery.status = 'in_transit'
      delivery.departureTime = new Date()
      return true
    }
    return false
  }

  completeDelivery(deliveryId) {
    const delivery = this.deliveries.find(d => d.id === deliveryId)
    if (delivery) {
      delivery.status = 'completed'
      delivery.actualArrival = new Date()
      delivery.onTime = delivery.actualArrival <= delivery.estimatedArrival

      const vehicle = this.vehicles.find(v => v.id === delivery.vehicleId)
      if (vehicle) {
        vehicle.status = 'idle'
        vehicle.currentDelivery = null
        vehicle.currentLoad = 0
        vehicle.currentRoute = null
        vehicle.routeProgress = 0
      }
    }
  }

  getVehicleById(vehicleId) {
    return this.vehicles.find(v => v.id === vehicleId)
  }

  getActiveDeliveries() {
    return this.deliveries.filter(d => d.status === 'in_transit')
  }

  getOpenAnomalies() {
    return this.anomalies.filter(a => a.status === 'open')
  }

  getVehicleStats() {
    return this.vehicles.map(v => ({
      id: v.id,
      status: v.status,
      temperature: v.temperature,
      load: v.currentLoad,
      capacity: v.capacity,
      loadRate: ((v.currentLoad / v.capacity) * 100).toFixed(1)
    }))
  }

  getDeliveryStatistics() {
    const completed = this.deliveries.filter(d => d.status === 'completed')
    const onTime = completed.filter(d => d.onTime).length
    return {
      total: this.deliveries.length,
      completed: completed.length,
      inTransit: this.deliveries.filter(d => d.status === 'in_transit').length,
      onTimeRate: completed.length > 0 ? ((onTime / completed.length) * 100).toFixed(1) : '0.0'
    }
  }

  updateVehicleLocation(vehicleId, x, z) {
    const vehicle = this.vehicles.find(v => v.id === vehicleId)
    if (vehicle) {
      vehicle.location = { x, z }
    }
  }
}

export const coldChainManager = new ColdChainManager()
