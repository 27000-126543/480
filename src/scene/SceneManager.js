import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createStorageArea } from './areas/StorageArea.js'
import { createProcessingArea } from './areas/ProcessingArea.js'
import { createCookingArea } from './areas/CookingArea.js'
import { createPackagingArea } from './areas/PackagingArea.js'
import { createColdChainArea } from './areas/ColdChainArea.js'
import { createControlCenter } from './areas/ControlCenter.js'
import { createWorkstation } from './objects/Workstation.js'
import { createShelf } from './objects/Shelf.js'
import { createDeliveryVehicle } from './objects/DeliveryVehicle.js'
import { EnvironmentSystem } from './systems/EnvironmentSystem.js'
import { AirflowSystem } from './systems/AirflowSystem.js'
import { schedulingManager } from '../managers/SchedulingManager.js'
import { inventoryManager } from '../managers/InventoryManager.js'

class SceneManager {
  constructor() {
    this.scene = null
    this.camera = null
    this.renderer = null
    this.controls = null
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.workstations = []
    this.shelves = []
    this.deliveryVehicles = []
    this.clickableObjects = []
    this.onWorkstationClick = null
    this.onShelfClick = null
    this.onVehicleClick = null
    this.animationId = null
    this.clock = new THREE.Clock()
    this.environmentSystem = null
    this.airflowSystem = null
    this.areaLabels = []
  }

  init(containerId) {
    const container = document.getElementById(containerId)
    if (!container) {
      console.error('Container not found:', containerId)
      return
    }

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a1628)
    this.scene.fog = new THREE.Fog(0x0a1628, 50, 200)

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(40, 35, 40)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 15
    this.controls.maxDistance = 100
    this.controls.maxPolarAngle = Math.PI / 2.1
    this.controls.target.set(0, 0, 0)

    this.setupLighting()
    this.createFloor()
    this.createAreas()
    this.createWorkstations()
    this.createShelves()
    this.createDeliveryVehicles()
    this.createEnvironmentSensors()
    this.createAreaLabels()

    this.environmentSystem = new EnvironmentSystem(this.scene)
    this.airflowSystem = new AirflowSystem(this.scene)

    this.setupEventListeners()
    this.animate()
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
    mainLight.position.set(30, 50, 30)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 4096
    mainLight.shadow.mapSize.height = 4096
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 200
    mainLight.shadow.camera.left = -60
    mainLight.shadow.camera.right = 60
    mainLight.shadow.camera.top = 60
    mainLight.shadow.camera.bottom = -60
    this.scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3)
    fillLight.position.set(-30, 20, -30)
    this.scene.add(fillLight)

    const areaColors = [0x1890ff, 0x52c41a, 0xfaad14, 0x13c2c2, 0x722ed1, 0xeb2f96]
    const areaPositions = [
      { x: -25, z: -15 },
      { x: -5, z: -15 },
      { x: 15, z: -15 },
      { x: -25, z: 10 },
      { x: -5, z: 10 },
      { x: 15, z: 10 }
    ]

    areaPositions.forEach((pos, i) => {
      const areaLight = new THREE.PointLight(areaColors[i], 0.5, 25)
      areaLight.position.set(pos.x, 8, pos.z)
      this.scene.add(areaLight)
    })

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x2d4a3e, 0.3)
    this.scene.add(hemisphereLight)
  }

  createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(80, 60)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a,
      roughness: 0.8,
      metalness: 0.2
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)

    const gridHelper = new THREE.GridHelper(80, 40, 0x1890ff, 0x0d2847)
    gridHelper.position.y = 0.01
    this.scene.add(gridHelper)

    const gridGeometry = new THREE.PlaneGeometry(80, 60)
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x1890ff,
      transparent: true,
      opacity: 0.03,
      side: THREE.DoubleSide
    })
    const grid = new THREE.Mesh(gridGeometry, gridMaterial)
    grid.rotation.x = -Math.PI / 2
    grid.position.y = 0.02
    this.scene.add(grid)
  }

  createAreas() {
    const areas = [
      { builder: createStorageArea, position: new THREE.Vector3(-25, 0, -15), name: '原料仓储区' },
      { builder: createProcessingArea, position: new THREE.Vector3(-5, 0, -15), name: '初加工间' },
      { builder: createCookingArea, position: new THREE.Vector3(15, 0, -15), name: '热厨区' },
      { builder: createPackagingArea, position: new THREE.Vector3(-25, 0, 10), name: '包装区' },
      { builder: createColdChainArea, position: new THREE.Vector3(-5, 0, 10), name: '冷链配送区' },
      { builder: createControlCenter, position: new THREE.Vector3(15, 0, 10), name: '调度中心' }
    ]

    areas.forEach(area => {
      const areaGroup = area.builder()
      areaGroup.position.copy(area.position)
      areaGroup.userData.areaName = area.name
      this.scene.add(areaGroup)
    })
  }

  createAreaLabels() {
    const labelData = [
      { text: '原料仓储区', pos: new THREE.Vector3(-25, 6, -22), color: 0x1890ff },
      { text: '初加工间', pos: new THREE.Vector3(-5, 6, -22), color: 0x52c41a },
      { text: '热厨区', pos: new THREE.Vector3(15, 6, -22), color: 0xfaad14 },
      { text: '包装区', pos: new THREE.Vector3(-25, 6, 17), color: 0x13c2c2 },
      { text: '冷链配送区', pos: new THREE.Vector3(-5, 6, 17), color: 0x722ed1 },
      { text: '调度中心', pos: new THREE.Vector3(15, 6, 17), color: 0xeb2f96 }
    ]

    labelData.forEach(data => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = 256
      canvas.height = 64

      ctx.fillStyle = 'transparent'
      ctx.fillRect(0, 0, 256, 64)

      const gradient = ctx.createLinearGradient(0, 0, 256, 0)
      gradient.addColorStop(0, '#' + data.color.toString(16).padStart(6, '0'))
      gradient.addColorStop(1, '#ffffff')
      ctx.fillStyle = gradient
      ctx.font = 'bold 28px Microsoft YaHei'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = '#' + data.color.toString(16).padStart(6, '0')
      ctx.shadowBlur = 10
      ctx.fillText(data.text, 128, 32)

      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true

      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false
      })
      const sprite = new THREE.Sprite(spriteMaterial)
      sprite.position.copy(data.pos)
      sprite.scale.set(8, 2, 1)
      this.scene.add(sprite)
      this.areaLabels.push(sprite)
    })
  }

  createWorkstations() {
    const workstationConfigs = [
      { id: 'W001', area: '初加工间', position: new THREE.Vector3(-10, 0, -15), type: 'processing' },
      { id: 'W002', area: '初加工间', position: new THREE.Vector3(-5, 0, -18), type: 'processing' },
      { id: 'W003', area: '初加工间', position: new THREE.Vector3(0, 0, -15), type: 'processing' },
      { id: 'W004', area: '热厨区', position: new THREE.Vector3(10, 0, -15), type: 'cooking' },
      { id: 'W005', area: '热厨区', position: new THREE.Vector3(15, 0, -18), type: 'cooking' },
      { id: 'W006', area: '热厨区', position: new THREE.Vector3(20, 0, -15), type: 'cooking' },
      { id: 'W007', area: '热厨区', position: new THREE.Vector3(15, 0, -12), type: 'cooking' },
      { id: 'W008', area: '包装区', position: new THREE.Vector3(-30, 0, 10), type: 'packaging' },
      { id: 'W009', area: '包装区', position: new THREE.Vector3(-25, 0, 13), type: 'packaging' },
      { id: 'W010', area: '包装区', position: new THREE.Vector3(-20, 0, 10), type: 'packaging' },
      { id: 'W011', area: '包装区', position: new THREE.Vector3(-25, 0, 7), type: 'packaging' }
    ]

    const dishNames = ['红烧肉', '清蒸鱼', '宫保鸡丁', '麻婆豆腐', '糖醋排骨', '西红柿炒蛋', '青椒肉丝', '鱼香茄子', '回锅肉', '水煮鱼', '可乐鸡翅', '蒜蓉西兰花']

    workstationConfigs.forEach(config => {
      const workstation = createWorkstation({
        id: config.id,
        type: config.type,
        currentDish: dishNames[Math.floor(Math.random() * dishNames.length)],
        capacityRate: 60 + Math.random() * 35,
        temperature: 18 + Math.random() * 15,
        humidity: 40 + Math.random() * 30,
        runtime: Math.random() * 5
      })
      workstation.position.copy(config.position)
      workstation.userData = { ...workstation.userData, area: config.area, config }
      this.scene.add(workstation)
      this.workstations.push(workstation)
      this.clickableObjects.push(workstation)
    })
  }

  createShelves() {
    const shelfConfigs = [
      { id: 'S001', area: '原料仓储区', position: new THREE.Vector3(-32, 0, -18), ingredient: '猪肉', stock: 150, maxStock: 500, threshold: 100 },
      { id: 'S002', area: '原料仓储区', position: new THREE.Vector3(-28, 0, -18), ingredient: '鸡肉', stock: 80, maxStock: 400, threshold: 80 },
      { id: 'S003', area: '原料仓储区', position: new THREE.Vector3(-24, 0, -18), ingredient: '牛肉', stock: 200, maxStock: 300, threshold: 60 },
      { id: 'S004', area: '原料仓储区', position: new THREE.Vector3(-20, 0, -18), ingredient: '蔬菜', stock: 300, maxStock: 600, threshold: 150 },
      { id: 'S005', area: '原料仓储区', position: new THREE.Vector3(-32, 0, -12), ingredient: '水产', stock: 45, maxStock: 200, threshold: 50 },
      { id: 'S006', area: '原料仓储区', position: new THREE.Vector3(-28, 0, -12), ingredient: '米面', stock: 400, maxStock: 800, threshold: 200 },
      { id: 'S007', area: '原料仓储区', position: new THREE.Vector3(-24, 0, -12), ingredient: '调料', stock: 120, maxStock: 300, threshold: 60 },
      { id: 'S008', area: '原料仓储区', position: new THREE.Vector3(-20, 0, -12), ingredient: '食用油', stock: 90, maxStock: 200, threshold: 50 }
    ]

    shelfConfigs.forEach(config => {
      const shelf = createShelf(config)
      shelf.position.copy(config.position)
      this.scene.add(shelf)
      this.shelves.push(shelf)
      this.clickableObjects.push(shelf)
    })
  }

  createDeliveryVehicles() {
    const vehicleConfigs = [
      { id: 'V001', position: new THREE.Vector3(-10, 0, 10), temperature: -18, status: 'idle', route: null },
      { id: 'V002', position: new THREE.Vector3(-5, 0, 13), temperature: -20, status: 'delivering', route: this.createDeliveryRoute() },
      { id: 'V003', position: new THREE.Vector3(0, 0, 10), temperature: -15, status: 'idle', route: null }
    ]

    vehicleConfigs.forEach(config => {
      const vehicle = createDeliveryVehicle(config)
      vehicle.position.copy(config.position)
      this.scene.add(vehicle)
      this.deliveryVehicles.push(vehicle)
      this.clickableObjects.push(vehicle)
    })
  }

  createDeliveryRoute() {
    const points = []
    points.push(new THREE.Vector3(-5, 0.1, 13))
    points.push(new THREE.Vector3(-15, 0.1, 13))
    points.push(new THREE.Vector3(-15, 0.1, 5))
    points.push(new THREE.Vector3(-28, 0.1, 5))
    points.push(new THREE.Vector3(-28, 0.1, -15))
    points.push(new THREE.Vector3(-20, 0.1, -15))
    
    const curve = new THREE.CatmullRomCurve3(points)
    curve.curveType = 'centripetal'
    return curve
  }

  createEnvironmentSensors() {
    const sensorPositions = [
      { pos: new THREE.Vector3(-25, 5, -15), area: '原料仓储区' },
      { pos: new THREE.Vector3(-5, 5, -15), area: '初加工间' },
      { pos: new THREE.Vector3(15, 5, -15), area: '热厨区' },
      { pos: new THREE.Vector3(-25, 5, 10), area: '包装区' },
      { pos: new THREE.Vector3(-5, 5, 10), area: '冷链配送区' },
      { pos: new THREE.Vector3(15, 5, 10), area: '调度中心' }
    ]

    this.environmentSensors = sensorPositions.map((sensor, index) => {
      const geometry = new THREE.SphereGeometry(0.3, 16, 16)
      const material = new THREE.MeshBasicMaterial({ color: 0x1890ff })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(sensor.pos)
      mesh.userData = { id: `ES${String(index + 1).padStart(3, '0')}`, area: sensor.area }
      this.scene.add(mesh)
      return mesh
    })
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize())
    this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event))
    this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event))
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  onMouseClick(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.clickableObjects, true)

    if (intersects.length > 0) {
      let clickedObject = intersects[0].object
      while (clickedObject.parent && !clickedObject.userData.type) {
        clickedObject = clickedObject.parent
      }

      if (clickedObject.userData.type === 'workstation' && this.onWorkstationClick) {
        this.onWorkstationClick(clickedObject.userData)
      } else if (clickedObject.userData.type === 'shelf' && this.onShelfClick) {
        this.onShelfClick(clickedObject.userData)
      } else if (clickedObject.userData.type === 'deliveryVehicle' && this.onVehicleClick) {
        this.onVehicleClick(clickedObject.userData)
      }
    }
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.clickableObjects, true)

    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default'
  }

  updateWorkstationData(id, data) {
    const workstation = this.workstations.find(w => w.userData.id === id)
    if (workstation) {
      Object.assign(workstation.userData, data)
      this.updateWorkstationDisplay(workstation)
    }
  }

  updateWorkstationDisplay(workstation) {
    const data = workstation.userData
    const label = workstation.getObjectByName('infoLabel')
    const statusLight = workstation.getObjectByName('statusLight')
    
    if (statusLight) {
      let color = 0x52c41a
      if (data.status === 'maintenance') color = 0xfaad14
      else if (data.status === 'fault') color = 0xff4d4f
      else if (data.status === 'idle') color = 0x8c8c8c
      statusLight.material.color.setHex(color)
    }
    
    if (label) {
      const canvas = label.material.map.image
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      ctx.fillStyle = 'rgba(16, 32, 60, 0.95)'
      ctx.fillRect(0, 0, 256, 128)
      
      ctx.strokeStyle = data.status === 'maintenance' ? '#faad14' : data.status === 'fault' ? '#ff4d4f' : '#1890ff'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, 256, 128)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 18px Microsoft YaHei'
      ctx.textAlign = 'left'
      ctx.fillText(`工位 ${data.id}`, 10, 25)
      
      ctx.fillStyle = '#e6f7ff'
      ctx.font = '14px Microsoft YaHei'
      ctx.fillText(`菜品: ${data.currentDish}`, 10, 50)
      
      const statusText = {
        'running': '运行中',
        'maintenance': '维护中',
        'fault': '故障',
        'idle': '空闲'
      }[data.status] || '运行中'
      ctx.fillStyle = data.status === 'maintenance' ? '#faad14' : data.status === 'fault' ? '#ff4d4f' : '#52c41a'
      ctx.fillText(`状态: ${statusText}`, 140, 25)
      
      const capacityColor = data.capacityRate > 80 ? '#ff4d4f' : data.capacityRate > 60 ? '#faad14' : '#52c41a'
      ctx.fillStyle = capacityColor
      ctx.fillText(`产能: ${data.capacityRate.toFixed(1)}%`, 10, 72)
      
      ctx.fillStyle = '#1890ff'
      ctx.fillText(`温度: ${data.temperature.toFixed(1)}°C`, 10, 94)
      
      ctx.fillStyle = '#13c2c2'
      ctx.fillText(`湿度: ${data.humidity.toFixed(1)}%`, 140, 94)
      
      ctx.fillStyle = '#8c8c8c'
      ctx.font = '11px Microsoft YaHei'
      ctx.fillText(`运行: ${data.runtime.toFixed(1)}h`, 10, 118)
      
      label.material.map.needsUpdate = true
    }
  }

  updateShelfData(id, data) {
    const shelf = this.shelves.find(s => s.userData.id === id)
    if (shelf) {
      Object.assign(shelf.userData, data)
      this.updateShelfDisplay(shelf)
    }
  }

  updateShelfDisplay(shelf) {
    const data = shelf.userData
    const liveItem = inventoryManager.getInventoryItem(data.id)
    if (liveItem) {
      data.stock = liveItem.stock
      data.maxStock = liveItem.maxStock
      data.threshold = liveItem.threshold
    }
    const frame = shelf.getObjectByName('frame')
    const stockBar = shelf.getObjectByName('stockBar')
    
    const stockRatio = data.maxStock > 0 ? data.stock / data.maxStock : 0
    if (stockBar) {
      stockBar.scale.y = Math.max(0.01, stockRatio * 3)
      stockBar.position.y = stockBar.scale.y / 2 + 0.1
      
      const stockColor = data.stock < data.threshold ? 0xfaad14 : 0x52c41a
      stockBar.material.color.setHex(stockColor)
    }
    
    if (frame) {
      if (data.stock < data.threshold) {
        frame.material.color.setHex(0xfaad14)
        if (frame.material.emissive) {
          frame.material.emissive.setHex(0xfaad14)
          frame.material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.5
        }
      } else {
        frame.material.color.setHex(0x1890ff)
        if (frame.material.emissive) {
          frame.material.emissive.setHex(0x1890ff)
          frame.material.emissiveIntensity = 0.1
        }
      }
    }
  }

  updateVehicleData(id, data) {
    const vehicle = this.deliveryVehicles.find(v => v.userData.id === id)
    if (vehicle) {
      Object.assign(vehicle.userData, data)
      this.updateVehicleDisplay(vehicle)
    }
  }

  updateVehicleDisplay(vehicle) {
    const data = vehicle.userData
    const body = vehicle.getObjectByName('body')
    
    if (data.temperature > -10 || data.temperature > data.targetTemp + 5) {
      body.material.color.setHex(0xff4d4f)
      body.material.emissive.setHex(0xff4d4f)
      body.material.emissiveIntensity = 0.3
    } else {
      body.material.color.setHex(0x722ed1)
      body.material.emissive.setHex(0x722ed1)
      body.material.emissiveIntensity = 0.1
    }
  }

  startAirflow() {
    this.airflowSystem.start()
  }

  stopAirflow() {
    this.airflowSystem.stop()
  }

  triggerEnvironmentAlert(type) {
    this.environmentSystem.triggerAlert(type)
  }

  focusOnArea(areaName) {
    const areaPositions = {
      '原料仓储区': new THREE.Vector3(-25, 15, -15),
      '初加工间': new THREE.Vector3(-5, 15, -15),
      '热厨区': new THREE.Vector3(15, 15, -15),
      '包装区': new THREE.Vector3(-25, 15, 10),
      '冷链配送区': new THREE.Vector3(-5, 15, 10),
      '调度中心': new THREE.Vector3(15, 15, 10),
      '全局': new THREE.Vector3(40, 35, 40)
    }

    const target = areaPositions[areaName] || areaPositions['全局']
    const startPos = this.camera.position.clone()
    const startTarget = this.controls.target.clone()
    const endTarget = areaName === '全局' ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(target.x, 0, target.z)

    let progress = 0
    const animateCamera = () => {
      progress += 0.02
      if (progress >= 1) return

      const t = 1 - Math.pow(1 - progress, 3)
      this.camera.position.lerpVectors(startPos, target, t)
      this.controls.target.lerpVectors(startTarget, endTarget, t)
      this.controls.update()

      requestAnimationFrame(animateCamera)
    }
    animateCamera()
  }

  getWorkstationData() {
    return this.workstations.map(w => ({ ...w.userData }))
  }

  getShelfData() {
    return this.shelves.map(s => ({ ...s.userData }))
  }

  getVehicleData() {
    return this.deliveryVehicles.map(v => ({ ...v.userData }))
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate())

    const delta = this.clock.getDelta()
    const elapsed = this.clock.getElapsedTime()

    this.controls.update()

    this.workstations.forEach(workstation => {
      const data = workstation.userData
      if (data.status !== 'maintenance' && data.status !== 'fault') {
        data.runtime += delta / 3600
        if (data.runtime > 4 && !data.maintenanceScheduled) {
          data.maintenanceScheduled = true
          data.status = 'maintenance'
          schedulingManager.checkAndScheduleMaintenance(data.id, data.runtime)
          if (data.statusLight) {
            data.statusLight.material.color.setHex(0xfaad14)
          }
        }
      }
      this.updateWorkstationDisplay(workstation)
    })

    this.shelves.forEach(shelf => {
      this.updateShelfDisplay(shelf)
    })

    this.deliveryVehicles.forEach(vehicle => {
      const data = vehicle.userData
      if (data.status === 'delivering' && data.route) {
        data.routeProgress = (data.routeProgress || 0) + delta * 0.05
        if (data.routeProgress > 1) {
          data.routeProgress = 0
          data.status = 'idle'
        } else {
          const point = data.route.getPoint(data.routeProgress)
          vehicle.position.copy(point)
          
          const tangent = data.route.getTangent(data.routeProgress)
          vehicle.lookAt(vehicle.position.clone().add(tangent))
        }
      }
      this.updateVehicleDisplay(vehicle)
    })

    this.areaLabels.forEach(label => {
      label.lookAt(this.camera.position)
    })

    if (this.airflowSystem) {
      this.airflowSystem.update(delta, elapsed)
    }

    if (this.environmentSystem) {
      this.environmentSystem.update(delta, elapsed)
    }

    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.renderer.dispose()
    window.removeEventListener('resize', () => this.onWindowResize())
  }
}

export const sceneManager = new SceneManager()
