import * as THREE from 'three'

export function createShelf(options) {
  const {
    id = 'S001',
    ingredient = '猪肉',
    stock = 200,
    maxStock = 500,
    threshold = 100
  } = options

  const group = new THREE.Group()
  group.userData = {
    type: 'shelf',
    id,
    ingredient,
    stock,
    maxStock,
    threshold,
    unit: 'kg',
    replenishmentRequests: [],
    lastReplenished: null
  }

  const baseGeometry = new THREE.BoxGeometry(3, 0.1, 1.5)
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d2d2d,
    roughness: 0.7,
    metalness: 0.3
  })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = 0.05
  base.receiveShadow = true
  group.add(base)

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x1890ff,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x1890ff,
    emissiveIntensity: 0.1,
    transparent: true,
    opacity: 0.05
  })

  const frameGeometry = new THREE.BoxGeometry(3, 3.5, 1.5)
  const frame = new THREE.Mesh(frameGeometry, frameMaterial.clone())
  frame.position.set(0, 1.75, 0)
  frame.name = 'frame'
  group.add(frame)

  const frameEdges = new THREE.EdgesGeometry(frameGeometry)
  const frameLines = new THREE.LineSegments(frameEdges, new THREE.LineBasicMaterial({
    color: 0x1890ff,
    transparent: true,
    opacity: 0.8
  }))
  frameLines.position.set(0, 1.75, 0)
  group.add(frameLines)

  const stockRatio = stock / maxStock
  const stockColor = stock < threshold ? 0xfaad14 : 0x52c41a

  const stockBarGeometry = new THREE.BoxGeometry(2.8, 3, 1.3)
  const stockBarMaterial = new THREE.MeshStandardMaterial({
    color: stockColor,
    transparent: true,
    opacity: 0.6,
    emissive: stockColor,
    emissiveIntensity: 0.2
  })
  const stockBar = new THREE.Mesh(stockBarGeometry, stockBarMaterial)
  stockBar.scale.y = Math.max(0.01, stockRatio * 3)
  stockBar.position.y = stockBar.scale.y / 2 + 0.1
  stockBar.name = 'stockBar'
  group.add(stockBar)

  const itemGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.3)
  const itemMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.8,
    metalness: 0.1
  })

  const tiers = Math.min(4, Math.ceil(stockRatio * 4))
  const itemsPerTier = Math.min(6, Math.ceil((stock / maxStock) * 6))

  for (let tier = 0; tier < tiers; tier++) {
    for (let i = 0; i < itemsPerTier; i++) {
      const item = new THREE.Mesh(itemGeometry, itemMaterial)
      item.position.set(
        -1.1 + (i % 3) * 0.5,
        0.7 + tier * 0.8,
        -0.3 + Math.floor(i / 3) * 0.4
      )
      item.castShadow = true
      group.add(item)
    }
  }

  const infoCanvas = document.createElement('canvas')
  infoCanvas.width = 256
  infoCanvas.height = 96
  const infoCtx = infoCanvas.getContext('2d')

  infoCtx.fillStyle = 'rgba(16, 32, 60, 0.95)'
  infoCtx.fillRect(0, 0, 256, 96)

  infoCtx.strokeStyle = '#1890ff'
  infoCtx.lineWidth = 2
  infoCtx.strokeRect(0, 0, 256, 96)

  infoCtx.fillStyle = '#ffffff'
  infoCtx.font = 'bold 16px Microsoft YaHei'
  infoCtx.textAlign = 'left'
  infoCtx.fillText(`货架 ${id}`, 10, 22)

  infoCtx.fillStyle = '#e6f7ff'
  infoCtx.font = '14px Microsoft YaHei'
  infoCtx.fillText(`食材: ${ingredient}`, 10, 44)

  const stockTextColor = stock < threshold ? '#faad14' : '#52c41a'
  infoCtx.fillStyle = stockTextColor
  infoCtx.fillText(`库存: ${stock}/${maxStock} ${group.userData.unit}`, 10, 66)

  const thresholdColor = stock < threshold ? '#ff4d4f' : '#8c8c8c'
  infoCtx.fillStyle = thresholdColor
  infoCtx.fillText(`阈值: ${threshold}`, 140, 66)

  const infoTexture = new THREE.CanvasTexture(infoCanvas)
  infoTexture.needsUpdate = true

  const infoMaterial = new THREE.SpriteMaterial({
    map: infoTexture,
    transparent: true,
    depthWrite: false
  })
  const infoLabel = new THREE.Sprite(infoMaterial)
  infoLabel.position.set(0, 4.5, 0)
  infoLabel.scale.set(2.5, 1, 1)
  infoLabel.name = 'infoLabel'
  group.add(infoLabel)

  if (stock < threshold) {
    const warningCanvas = document.createElement('canvas')
    warningCanvas.width = 128
    warningCanvas.height = 32
    const warningCtx = warningCanvas.getContext('2d')
    
    warningCtx.fillStyle = 'rgba(250, 173, 20, 0.9)'
    warningCtx.fillRect(0, 0, 128, 32)
    
    warningCtx.fillStyle = '#ffffff'
    warningCtx.font = 'bold 14px Microsoft YaHei'
    warningCtx.textAlign = 'center'
    warningCtx.fillText('⚠️ 库存预警', 64, 22)
    
    const warningTexture = new THREE.CanvasTexture(warningCanvas)
    const warningMaterial = new THREE.SpriteMaterial({
      map: warningTexture,
      transparent: true,
      depthWrite: false
    })
    const warningLabel = new THREE.Sprite(warningMaterial)
    warningLabel.position.set(0, 5.2, 0)
    warningLabel.scale.set(1.5, 0.4, 1)
    warningLabel.name = 'warningLabel'
    group.add(warningLabel)
  }

  const selectionRingGeometry = new THREE.TorusGeometry(2, 0.05, 8, 32)
  const selectionRingMaterial = new THREE.MeshBasicMaterial({
    color: 0xfaad14,
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
