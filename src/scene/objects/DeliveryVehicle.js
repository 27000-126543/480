import * as THREE from 'three'

export function createDeliveryVehicle(options) {
  const {
    id = 'V001',
    temperature = -18,
    status = 'idle',
    route = null
  } = options

  const group = new THREE.Group()
  group.userData = {
    type: 'deliveryVehicle',
    id,
    temperature,
    targetTemp: -18,
    status,
    route,
    routeProgress: 0,
    backupCoolingActive: false,
    currentLocation: '仓库',
    destination: null,
    load: [],
    anomalies: []
  }

  const bodyGeometry = new THREE.BoxGeometry(4, 2, 2.2)
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x722ed1,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0x722ed1,
    emissiveIntensity: 0.1
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 1.2
  body.castShadow = true
  body.name = 'body'
  group.add(body)

  const bodyFrameGeometry = new THREE.EdgesGeometry(bodyGeometry)
  const bodyFrameMaterial = new THREE.LineBasicMaterial({
    color: 0x9254de,
    transparent: true,
    opacity: 0.6
  })
  const bodyFrame = new THREE.LineSegments(bodyFrameGeometry, bodyFrameMaterial)
  bodyFrame.position.y = 1.2
  group.add(bodyFrame)

  const cabinGeometry = new THREE.BoxGeometry(1.5, 1.8, 2)
  const cabinMaterial = new THREE.MeshStandardMaterial({
    color: 0x531dab,
    metalness: 0.7,
    roughness: 0.3
  })
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial)
  cabin.position.set(2.2, 1.1, 0)
  cabin.castShadow = true
  group.add(cabin)

  const windshieldGeometry = new THREE.BoxGeometry(0.05, 0.8, 1.6)
  const windshieldMaterial = new THREE.MeshStandardMaterial({
    color: 0x87ceeb,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.6
  })
  const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial)
  windshield.position.set(2.98, 1.4, 0)
  group.add(windshield)

  const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16)
  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f1f1f,
    roughness: 0.9,
    metalness: 0.1
  })
  const wheelPositions = [
    [-1.5, 0.4, 1.1], [1.5, 0.4, 1.1], [-1.5, 0.4, -1.1], [1.5, 0.4, -1.1]
  ]
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
    wheel.rotation.z = Math.PI / 2
    wheel.position.set(pos[0], pos[1], pos[2])
    group.add(wheel)

    const rimGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.21, 8)
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xbfbfbf,
      metalness: 0.9,
      roughness: 0.1
    })
    const rim = new THREE.Mesh(rimGeometry, rimMaterial)
    rim.rotation.z = Math.PI / 2
    rim.position.set(pos[0], pos[1], pos[2])
    group.add(rim)
  })

  const refrigerationUnitGeometry = new THREE.BoxGeometry(0.8, 0.8, 2)
  const refrigerationUnitMaterial = new THREE.MeshStandardMaterial({
    color: 0x434343,
    metalness: 0.8,
    roughness: 0.2
  })
  const refrigerationUnit = new THREE.Mesh(refrigerationUnitGeometry, refrigerationUnitMaterial)
  refrigerationUnit.position.set(-2, 1.8, 0)
  refrigerationUnit.castShadow = true
  group.add(refrigerationUnit)

  const tempDisplayGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.05)
  const tempDisplayMaterial = new THREE.MeshBasicMaterial({
    color: 0x52c41a
  })
  const tempDisplay = new THREE.Mesh(tempDisplayGeometry, tempDisplayMaterial)
  tempDisplay.position.set(0, 2.4, 1.12)
  tempDisplay.name = 'tempDisplay'
  group.add(tempDisplay)

  const statusLightGeometry = new THREE.SphereGeometry(0.12, 16, 16)
  const statusLightMaterial = new THREE.MeshBasicMaterial({
    color: status === 'delivering' ? 0x1890ff : 0x52c41a
  })
  const statusLight = new THREE.Mesh(statusLightGeometry, statusLightMaterial)
  statusLight.position.set(1.5, 2.8, 0)
  statusLight.name = 'statusLight'
  group.add(statusLight)

  const infoCanvas = document.createElement('canvas')
  infoCanvas.width = 256
  infoCanvas.height = 96
  const infoCtx = infoCanvas.getContext('2d')

  updateInfoDisplay(infoCtx, group.userData)

  const infoTexture = new THREE.CanvasTexture(infoCanvas)
  infoTexture.needsUpdate = true

  const infoMaterial = new THREE.SpriteMaterial({
    map: infoTexture,
    transparent: true,
    depthWrite: false
  })
  const infoLabel = new THREE.Sprite(infoMaterial)
  infoLabel.position.set(0, 4, 0)
  infoLabel.scale.set(3, 1.2, 1)
  infoLabel.name = 'infoLabel'
  group.add(infoLabel)

  const pathLineGeometry = new THREE.BufferGeometry()
  const pathLineMaterial = new THREE.LineBasicMaterial({
    color: 0x52c41a,
    transparent: true,
    opacity: 0.8
  })
  const pathLine = new THREE.Line(pathLineGeometry, pathLineMaterial)
  pathLine.name = 'pathLine'
  pathLine.visible = false
  group.add(pathLine)

  if (route) {
    const points = route.getPoints(50)
    pathLineGeometry.setFromPoints(points)
    pathLine.visible = true
  }

  const selectionRingGeometry = new THREE.TorusGeometry(3, 0.05, 8, 32)
  const selectionRingMaterial = new THREE.MeshBasicMaterial({
    color: 0x722ed1,
    transparent: true,
    opacity: 0.7
  })
  const selectionRing = new THREE.Mesh(selectionRingGeometry, selectionRingMaterial)
  selectionRing.rotation.x = -Math.PI / 2
  selectionRing.position.y = 0.02
  selectionRing.name = 'selectionRing'
  selectionRing.visible = false
  group.add(selectionRing)

  return group
}

function updateInfoDisplay(ctx, data) {
  ctx.fillStyle = 'rgba(16, 32, 60, 0.95)'
  ctx.fillRect(0, 0, 256, 96)

  const borderColor = data.temperature > -10 ? '#ff4d4f' : '#722ed1'
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, 256, 96)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px Microsoft YaHei'
  ctx.textAlign = 'left'
  ctx.fillText(`配送车 ${data.id}`, 10, 22)

  const statusText = {
    'idle': '待命',
    'delivering': '配送中',
    'maintenance': '维护中',
    'fault': '故障'
  }
  const statusColors = {
    'idle': '#52c41a',
    'delivering': '#1890ff',
    'maintenance': '#faad14',
    'fault': '#ff4d4f'
  }
  ctx.fillStyle = statusColors[data.status] || '#52c41a'
  ctx.fillText(`状态: ${statusText[data.status] || data.status}`, 10, 44)

  const tempColor = data.temperature > -10 ? '#ff4d4f' : '#1890ff'
  ctx.fillStyle = tempColor
  ctx.font = 'bold 18px Microsoft YaHei'
  ctx.fillText(`温度: ${data.temperature.toFixed(1)}°C`, 10, 70)

  if (data.backupCoolingActive) {
    ctx.fillStyle = '#faad14'
    ctx.font = '12px Microsoft YaHei'
    ctx.fillText('备用制冷启动', 160, 70)
  }
}
