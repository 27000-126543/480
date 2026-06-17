import * as THREE from 'three'

export class EnvironmentSystem {
  constructor(scene) {
    this.scene = scene
    this.alerts = []
    this.alertObjects = []
    this.sensorData = {
      temperature: 22,
      humidity: 55,
      co2: 800,
      targetTemp: 22,
      targetHumidity: 55,
      maxCo2: 1000
    }
    this.warningThresholds = {
      tempHigh: 28,
      tempLow: 16,
      humidityHigh: 70,
      humidityLow: 40,
      co2High: 1500
    }
    this.newVentilationActive = false
  }

  update(delta, elapsed) {
    this.sensorData.temperature += (Math.random() - 0.5) * 0.1
    this.sensorData.humidity += (Math.random() - 0.5) * 0.2
    this.sensorData.co2 += (Math.random() - 0.3) * 5

    this.sensorData.temperature = Math.max(15, Math.min(35, this.sensorData.temperature))
    this.sensorData.humidity = Math.max(30, Math.min(80, this.sensorData.humidity))
    this.sensorData.co2 = Math.max(400, Math.min(2500, this.sensorData.co2))

    if (this.newVentilationActive) {
      this.sensorData.temperature += (this.sensorData.targetTemp - this.sensorData.temperature) * 0.01
      this.sensorData.humidity += (this.sensorData.targetHumidity - this.sensorData.humidity) * 0.01
      this.sensorData.co2 += (800 - this.sensorData.co2) * 0.02
    }

    this.checkAlerts()

    this.alertObjects.forEach((alert, index) => {
      if (alert.userData.pulse) {
        const scale = 1 + Math.sin(elapsed * 3 + index) * 0.2
        alert.scale.setScalar(scale)
      }
    })
  }

  checkAlerts() {
    const newAlerts = []

    if (this.sensorData.temperature > this.warningThresholds.tempHigh) {
      newAlerts.push({
        type: 'temperature',
        level: 'warning',
        message: `温度过高: ${this.sensorData.temperature.toFixed(1)}°C`,
        value: this.sensorData.temperature,
        threshold: this.warningThresholds.tempHigh
      })
    } else if (this.sensorData.temperature < this.warningThresholds.tempLow) {
      newAlerts.push({
        type: 'temperature',
        level: 'warning',
        message: `温度过低: ${this.sensorData.temperature.toFixed(1)}°C`,
        value: this.sensorData.temperature,
        threshold: this.warningThresholds.tempLow
      })
    }

    if (this.sensorData.humidity > this.warningThresholds.humidityHigh) {
      newAlerts.push({
        type: 'humidity',
        level: 'warning',
        message: `湿度过高: ${this.sensorData.humidity.toFixed(1)}%`,
        value: this.sensorData.humidity,
        threshold: this.warningThresholds.humidityHigh
      })
    } else if (this.sensorData.humidity < this.warningThresholds.humidityLow) {
      newAlerts.push({
        type: 'humidity',
        level: 'warning',
        message: `湿度过低: ${this.sensorData.humidity.toFixed(1)}%`,
        value: this.sensorData.humidity,
        threshold: this.warningThresholds.humidityLow
      })
    }

    if (this.sensorData.co2 > this.warningThresholds.co2High) {
      newAlerts.push({
        type: 'co2',
        level: 'danger',
        message: `CO₂浓度过高: ${this.sensorData.co2.toFixed(0)} ppm`,
        value: this.sensorData.co2,
        threshold: this.warningThresholds.co2High
      })
    }

    if (newAlerts.length > 0 && !this.newVentilationActive) {
      this.startNewVentilation()
    } else if (newAlerts.length === 0 && this.newVentilationActive) {
      this.stopNewVentilation()
    }

    this.alerts = newAlerts
    return newAlerts
  }

  startNewVentilation() {
    this.newVentilationActive = true
    this.createVentilationEffect()
  }

  stopNewVentilation() {
    this.newVentilationActive = false
    this.clearVentilationEffect()
  }

  createVentilationEffect() {
    const ventPositions = [
      { x: -25, z: -15 },
      { x: -5, z: -15 },
      { x: 15, z: -15 },
      { x: -25, z: 10 },
      { x: -5, z: 10 },
      { x: 15, z: 10 }
    ]

    ventPositions.forEach((pos, index) => {
      const geometry = new THREE.ConeGeometry(0.5, 3, 8)
      const material = new THREE.MeshBasicMaterial({
        color: 0x1890ff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      })
      const cone = new THREE.Mesh(geometry, material)
      cone.position.set(pos.x, 5, pos.z)
      cone.rotation.x = Math.PI
      cone.userData = { type: 'ventilation', pulse: true, index }
      this.scene.add(cone)
      this.alertObjects.push(cone)

      for (let i = 0; i < 5; i++) {
        const ringGeometry = new THREE.TorusGeometry(0.3 + i * 0.2, 0.05, 8, 16)
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0x1890ff,
          transparent: true,
          opacity: 0.3 - i * 0.05
        })
        const ring = new THREE.Mesh(ringGeometry, ringMaterial)
        ring.position.set(pos.x, 4 - i * 0.5, pos.z)
        ring.rotation.x = Math.PI / 2
        ring.userData = { type: 'ventilationRing', baseY: 4 - i * 0.5, offset: i * 0.2 }
        this.scene.add(ring)
        this.alertObjects.push(ring)
      }
    })
  }

  clearVentilationEffect() {
    this.alertObjects.forEach(obj => {
      this.scene.remove(obj)
    })
    this.alertObjects = []
  }

  triggerAlert(type) {
    if (type === 'temperature') {
      this.sensorData.temperature = 32
    } else if (type === 'humidity') {
      this.sensorData.humidity = 75
    } else if (type === 'co2') {
      this.sensorData.co2 = 2000
    }
  }

  getSensorData() {
    return { ...this.sensorData }
  }

  getAlerts() {
    return [...this.alerts]
  }

  isNewVentilationActive() {
    return this.newVentilationActive
  }
}
