import * as THREE from 'three'

export function createWorkstation(options) {
  const {
    id = 'W001',
    type = 'processing',
    currentDish = '红烧肉',
    capacityRate = 75,
    temperature = 22,
    humidity = 55,
    runtime = 0
  } = options

  const group = new THREE.Group()
  group.userData = {
    type: 'workstation',
    id,
    typeName: type,
    currentDish,
    capacityRate,
    temperature,
    humidity,
    runtime,
    status: 'running',
    maintenanceScheduled: false,
    productionHistory: generateProductionHistory()
  }

  const typeColors = {
    processing: { main: 0x52c41a, accent: 0x73d13d },
    cooking: { main: 0xfaad14, accent: 0xffc53d },
    packaging: { main: 0x13c2c2, accent: 0x36cfc9 }
  }

  const colors = typeColors[type] || typeColors.processing

  const baseGeometry = new THREE.BoxGeometry(2.5, 0.2, 2)
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d2d2d,
    roughness: 0.6,
    metalness: 0.4
  })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = 0.1
  base.castShadow = true
  base.receiveShadow = true
  group.add(base)

  const frameGeometry = new THREE.EdgesGeometry(baseGeometry)
  const frameMaterial = new THREE.LineBasicMaterial({
    color: colors.main,
    transparent: true,
    opacity: 0.8
  })
  const frame = new THREE.LineSegments(frameGeometry, frameMaterial)
  frame.position.y = 0.1
  group.add(frame)

  const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1)
  const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x595959,
    metalness: 0.8,
    roughness: 0.2
  })
  const legPositions = [
    [-1.1, 0.5, -0.85], [1.1, 0.5, -0.85], [-1.1, 0.5, 0.85], [1.1, 0.5, 0.85]
  ]
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, legMaterial)
    leg.position.set(pos[0], pos[1], pos[2])
    group.add(leg)
  })

  const tableTopGeometry = new THREE.BoxGeometry(2.4, 0.08, 1.9)
  const tableTopMaterial = new THREE.MeshStandardMaterial({
    color: 0x434343,
    roughness: 0.7,
    metalness: 0.3
  })
  const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial)
  tableTop.position.y = 0.95
  tableTop.castShadow = true
  group.add(tableTop)

  if (type === 'processing') {
    const machineGeometry = new THREE.BoxGeometry(1.5, 0.8, 1)
    const machineMaterial = new THREE.MeshStandardMaterial({
      color: 0xd9d9d9,
      metalness: 0.6,
      roughness: 0.4
    })
    const machine = new THREE.Mesh(machineGeometry, machineMaterial)
    machine.position.set(0, 1.4, 0)
    machine.castShadow = true
    group.add(machine)

    const displayGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.05)
    const displayMaterial = new THREE.MeshBasicMaterial({
      color: colors.main,
      transparent: true,
      opacity: 0.8
    })
    const display = new THREE.Mesh(displayGeometry, displayMaterial)
    display.position.set(0, 1.6, 0.52)
    group.add(display)
  } else if (type === 'cooking') {
    const stoveGeometry = new THREE.BoxGeometry(2, 0.6, 1.5)
    const stoveMaterial = new THREE.MeshStandardMaterial({
      color: 0x434343,
      metalness: 0.8,
      roughness: 0.3
    })
    const stove = new THREE.Mesh(stoveGeometry, stoveMaterial)
    stove.position.set(0, 1.3, 0)
    stove.castShadow = true
    group.add(stove)

    const burnerGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.03, 16)
    const burnerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff7a00,
      transparent: true,
      opacity: 0.9
    })
    const burnerPositions = [
      [-0.5, 1.6, -0.3], [0.5, 1.6, -0.3], [-0.5, 1.6, 0.3], [0.5, 1.6, 0.3]
    ]
    burnerPositions.forEach(pos => {
      const burner = new THREE.Mesh(burnerGeometry, burnerMaterial)
      burner.position.set(pos[0], pos[1], pos[2])
      group.add(burner)

      const potGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.4, 16)
      const potMaterial = new THREE.MeshStandardMaterial({
        color: 0x595959,
        metalness: 0.9,
        roughness: 0.1
      })
      const pot = new THREE.Mesh(potGeometry, potMaterial)
      pot.position.set(pos[0], pos[1] + 0.23, pos[2])
      pot.castShadow = true
      group.add(pot)
    })
  } else if (type === 'packaging') {
    const sealerGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.8)
    const sealerMaterial = new THREE.MeshStandardMaterial({
      color: 0xbfbfbf,
      metalness: 0.7,
      roughness: 0.3
    })
    const sealer = new THREE.Mesh(sealerGeometry, sealerMaterial)
    sealer.position.set(0, 1.3, 0)
    sealer.castShadow = true
    group.add(sealer)

    const boxGeometry = new THREE.BoxGeometry(0.4, 0.25, 0.3)
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
      metalness: 0.1
    })
    const boxPositions = [
      [-0.8, 1.1, 0], [0.8, 1.1, 0]
    ]
    boxPositions.forEach(pos => {
      const box = new THREE.Mesh(boxGeometry, boxMaterial)
      box.position.set(pos[0], pos[1], pos[2])
      box.castShadow = true
      group.add(box)
    })
  }

  const statusLightGeometry = new THREE.SphereGeometry(0.1, 16, 16)
  const statusLightMaterial = new THREE.MeshBasicMaterial({
    color: 0x52c41a
  })
  const statusLight = new THREE.Mesh(statusLightGeometry, statusLightMaterial)
  statusLight.position.set(1, 1.8, -0.8)
  statusLight.name = 'statusLight'
  group.add(statusLight)

  const infoCanvas = document.createElement('canvas')
  infoCanvas.width = 256
  infoCanvas.height = 128
  const infoCtx = infoCanvas.getContext('2d')

  infoCtx.fillStyle = 'rgba(16, 32, 60, 0.95)'
  infoCtx.fillRect(0, 0, 256, 128)

  infoCtx.strokeStyle = '#' + colors.main.toString(16).padStart(6, '0')
  infoCtx.lineWidth = 2
  infoCtx.strokeRect(0, 0, 256, 128)

  infoCtx.fillStyle = '#ffffff'
  infoCtx.font = 'bold 18px Microsoft YaHei'
  infoCtx.textAlign = 'left'
  infoCtx.fillText(`工位 ${id}`, 10, 25)

  infoCtx.fillStyle = '#e6f7ff'
  infoCtx.font = '14px Microsoft YaHei'
  infoCtx.fillText(`菜品: ${currentDish}`, 10, 50)

  const capacityColor = capacityRate > 80 ? '#ff4d4f' : capacityRate > 60 ? '#faad14' : '#52c41a'
  infoCtx.fillStyle = capacityColor
  infoCtx.fillText(`产能: ${capacityRate.toFixed(1)}%`, 10, 72)

  infoCtx.fillStyle = '#1890ff'
  infoCtx.fillText(`温度: ${temperature.toFixed(1)}°C`, 10, 94)

  infoCtx.fillStyle = '#13c2c2'
  infoCtx.fillText(`湿度: ${humidity.toFixed(1)}%`, 140, 94)

  const infoTexture = new THREE.CanvasTexture(infoCanvas)
  infoTexture.needsUpdate = true

  const infoMaterial = new THREE.SpriteMaterial({
    map: infoTexture,
    transparent: true,
    depthWrite: false
  })
  const infoLabel = new THREE.Sprite(infoMaterial)
  infoLabel.position.set(0, 3.5, 0)
  infoLabel.scale.set(3, 1.5, 1)
  infoLabel.name = 'infoLabel'
  group.add(infoLabel)

  const ringGeometry = new THREE.TorusGeometry(1.8, 0.03, 8, 32)
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: colors.main,
    transparent: true,
    opacity: 0.5
  })
  const ring = new THREE.Mesh(ringGeometry, ringMaterial)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.02
  ring.name = 'selectionRing'
  ring.visible = false
  group.add(ring)

  return group
}

function generateProductionHistory() {
  const hours = []
  const now = Date.now()
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now - i * 3600000).getHours()
    hours.push({
      hour,
      production: Math.floor(50 + Math.random() * 100),
      target: 100
    })
  }
  return hours
}
