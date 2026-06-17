import * as THREE from 'three'

export function createColdChainArea() {
  const group = new THREE.Group()
  group.userData.type = 'coldChainArea'

  const baseGeometry = new THREE.BoxGeometry(16, 0.2, 16)
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a1a3a,
    roughness: 0.7,
    metalness: 0.1
  })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = 0.1
  base.receiveShadow = true
  group.add(base)

  const borderGeometry = new THREE.EdgesGeometry(baseGeometry)
  const borderMaterial = new THREE.LineBasicMaterial({ color: 0x722ed1, transparent: true, opacity: 0.6 })
  const border = new THREE.LineSegments(borderGeometry, borderMaterial)
  border.position.y = 0.1
  group.add(border)

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a2d5a,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  })

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 0.2), wallMaterial)
  backWall.position.set(0, 4, -8)
  group.add(backWall)

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8, 16), wallMaterial)
  leftWall.position.set(-8, 4, 0)
  group.add(leftWall)

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8, 16), wallMaterial)
  rightWall.position.set(8, 4, 0)
  group.add(rightWall)

  const pillarGeometry = new THREE.CylinderGeometry(0.15, 0.15, 8, 8)
  const pillarMaterial = new THREE.MeshStandardMaterial({
    color: 0x722ed1,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x722ed1,
    emissiveIntensity: 0.2
  })

  const pillarPositions = [
    [-7, 0, -7], [7, 0, -7], [-7, 0, 7], [7, 0, 7]
  ]

  pillarPositions.forEach(pos => {
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial)
    pillar.position.set(pos[0], 4, pos[2])
    pillar.castShadow = true
    group.add(pillar)
  })

  const coldStorageGeometry = new THREE.BoxGeometry(6, 6, 5)
  const coldStorageMaterial = new THREE.MeshStandardMaterial({
    color: 0x1d39c4,
    metalness: 0.5,
    roughness: 0.4,
    transparent: true,
    opacity: 0.4
  })
  const coldStorage = new THREE.Mesh(coldStorageGeometry, coldStorageMaterial)
  coldStorage.position.set(-3, 3, -3)
  group.add(coldStorage)

  const coldStorageFrameGeometry = new THREE.EdgesGeometry(coldStorageGeometry)
  const coldStorageFrameMaterial = new THREE.LineBasicMaterial({
    color: 0x722ed1,
    transparent: true,
    opacity: 0.8
  })
  const coldStorageFrame = new THREE.LineSegments(coldStorageFrameGeometry, coldStorageFrameMaterial)
  coldStorageFrame.position.copy(coldStorage.position)
  group.add(coldStorageFrame)

  const coldStorageDoorGeometry = new THREE.BoxGeometry(2, 3, 0.2)
  const coldStorageDoorMaterial = new THREE.MeshStandardMaterial({
    color: 0x531dab,
    metalness: 0.6,
    roughness: 0.3
  })
  const coldStorageDoor = new THREE.Mesh(coldStorageDoorGeometry, coldStorageDoorMaterial)
  coldStorageDoor.position.set(-3, 1.5, 0.5)
  group.add(coldStorageDoor)

  const tempDisplayGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.05)
  const tempDisplayMaterial = new THREE.MeshBasicMaterial({
    color: 0x722ed1,
    transparent: true,
    opacity: 0.8
  })
  const tempDisplay = new THREE.Mesh(tempDisplayGeometry, tempDisplayMaterial)
  tempDisplay.position.set(-3, 5, -0.4)
  group.add(tempDisplay)

  const loadingDockGeometry = new THREE.BoxGeometry(8, 0.3, 4)
  const loadingDockMaterial = new THREE.MeshStandardMaterial({
    color: 0x595959,
    roughness: 0.8,
    metalness: 0.2
  })
  const loadingDock = new THREE.Mesh(loadingDockGeometry, loadingDockMaterial)
  loadingDock.position.set(3, 0.15, 4)
  loadingDock.castShadow = true
  group.add(loadingDock)

  const dockLevelerGeometry = new THREE.BoxGeometry(3, 0.1, 2)
  const dockLevelerMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c8c8c,
    metalness: 0.7,
    roughness: 0.3
  })
  const dockLeveler = new THREE.Mesh(dockLevelerGeometry, dockLevelerMaterial)
  dockLeveler.position.set(3, 0.35, 6)
  group.add(dockLeveler)

  const refrigerantUnitGeometry = new THREE.BoxGeometry(3, 2.5, 2)
  const refrigerantUnitMaterial = new THREE.MeshStandardMaterial({
    color: 0x262626,
    metalness: 0.8,
    roughness: 0.2
  })
  const refrigerantUnit = new THREE.Mesh(refrigerantUnitGeometry, refrigerantUnitMaterial)
  refrigerantUnit.position.set(3, 1.25, -5)
  refrigerantUnit.castShadow = true
  group.add(refrigerantUnit)

  const pipeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8)
  const pipeMaterial = new THREE.MeshStandardMaterial({
    color: 0x434343,
    metalness: 0.9,
    roughness: 0.1
  })
  const pipe1 = new THREE.Mesh(pipeGeometry, pipeMaterial)
  pipe1.rotation.z = Math.PI / 2
  pipe1.position.set(0, 5, -3)
  group.add(pipe1)

  const pipe2 = new THREE.Mesh(pipeGeometry, pipeMaterial)
  pipe2.position.set(3, 3.5, -3)
  group.add(pipe2)

  const fanGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16)
  const fanMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c8c8c,
    metalness: 0.8,
    roughness: 0.2
  })
  const fan = new THREE.Mesh(fanGeometry, fanMaterial)
  fan.rotation.x = Math.PI / 2
  fan.position.set(3, 3, -3.9)
  group.add(fan)

  const bladeGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.05)
  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: 0x595959,
    metalness: 0.9,
    roughness: 0.1
  })
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial)
    blade.rotation.z = (i * Math.PI) / 2
    blade.position.set(3, 3, -3.9)
    blade.userData = { type: 'fanBlade' }
    group.add(blade)
  }

  const lightGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.3)
  const lightMaterial = new THREE.MeshBasicMaterial({
    color: 0x9254de,
    transparent: true,
    opacity: 0.9
  })
  const lightPositions = [
    [-4, 7.8, 0], [4, 7.8, 0], [0, 7.8, -4], [0, 7.8, 4]
  ]
  lightPositions.forEach(pos => {
    const light = new THREE.Mesh(lightGeometry, lightMaterial)
    light.position.set(pos[0], pos[1], pos[2])
    group.add(light)
  })

  return group
}
