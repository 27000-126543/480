import * as THREE from 'three'

export function createPackagingArea() {
  const group = new THREE.Group()
  group.userData.type = 'packagingArea'

  const baseGeometry = new THREE.BoxGeometry(16, 0.2, 16)
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e3a3a,
    roughness: 0.7,
    metalness: 0.1
  })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = 0.1
  base.receiveShadow = true
  group.add(base)

  const borderGeometry = new THREE.EdgesGeometry(baseGeometry)
  const borderMaterial = new THREE.LineBasicMaterial({ color: 0x13c2c2, transparent: true, opacity: 0.6 })
  const border = new THREE.LineSegments(borderGeometry, borderMaterial)
  border.position.y = 0.1
  group.add(border)

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d5a5a,
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
    color: 0x13c2c2,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x13c2c2,
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

  const packingTableGeometry = new THREE.BoxGeometry(12, 0.15, 2)
  const packingTableMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d5a5a,
    roughness: 0.6,
    metalness: 0.2
  })
  const packingTable = new THREE.Mesh(packingTableGeometry, packingTableMaterial)
  packingTable.position.set(0, 1, 0)
  packingTable.castShadow = true
  group.add(packingTable)

  const tableLegGeometry = new THREE.BoxGeometry(0.15, 1, 0.15)
  const tableLegMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c8c8c,
    metalness: 0.7,
    roughness: 0.3
  })
  const legPositions = [
    [-5.5, 0.5, -0.8], [5.5, 0.5, -0.8], [-5.5, 0.5, 0.8], [5.5, 0.5, 0.8]
  ]
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(tableLegGeometry, tableLegMaterial)
    leg.position.set(pos[0], pos[1], pos[2])
    group.add(leg)
  })

  const sealingMachineGeometry = new THREE.BoxGeometry(2, 1.5, 1.5)
  const sealingMachineMaterial = new THREE.MeshStandardMaterial({
    color: 0xbfbfbf,
    metalness: 0.7,
    roughness: 0.3
  })
  const sealingMachine = new THREE.Mesh(sealingMachineGeometry, sealingMachineMaterial)
  sealingMachine.position.set(-4, 0.75, -4)
  sealingMachine.castShadow = true
  group.add(sealingMachine)

  const sealingDisplayGeometry = new THREE.BoxGeometry(1, 0.5, 0.05)
  const sealingDisplayMaterial = new THREE.MeshBasicMaterial({
    color: 0x13c2c2,
    transparent: true,
    opacity: 0.8
  })
  const sealingDisplay = new THREE.Mesh(sealingDisplayGeometry, sealingDisplayMaterial)
  sealingDisplay.position.set(-4, 1.2, -3.2)
  group.add(sealingDisplay)

  const labelingMachineGeometry = new THREE.BoxGeometry(2, 1.2, 1.5)
  const labelingMachineMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9d9d9,
    metalness: 0.6,
    roughness: 0.4
  })
  const labelingMachine = new THREE.Mesh(labelingMachineGeometry, labelingMachineMaterial)
  labelingMachine.position.set(4, 0.6, -4)
  labelingMachine.castShadow = true
  group.add(labelingMachine)

  const boxGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.4)
  const boxMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.8,
    metalness: 0.1
  })
  const boxPositions = [
    [-3, 1.25, 0], [-2, 1.25, 0], [-1, 1.25, 0],
    [1, 1.25, 0], [2, 1.25, 0], [3, 1.25, 0]
  ]
  boxPositions.forEach(pos => {
    const box = new THREE.Mesh(boxGeometry, boxMaterial)
    box.position.set(pos[0], pos[1], pos[2])
    box.castShadow = true
    group.add(box)
  })

  const conveyor2Geometry = new THREE.BoxGeometry(6, 0.3, 1)
  const conveyor2Material = new THREE.MeshStandardMaterial({
    color: 0x434343,
    roughness: 0.9,
    metalness: 0.1
  })
  const conveyor2 = new THREE.Mesh(conveyor2Geometry, conveyor2Material)
  conveyor2.position.set(0, 0.8, 4)
  conveyor2.castShadow = true
  group.add(conveyor2)

  const conveyor2FrameGeometry = new THREE.BoxGeometry(6.2, 0.5, 1.2)
  const conveyor2FrameMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c8c8c,
    metalness: 0.7,
    roughness: 0.3
  })
  const conveyor2Frame = new THREE.Mesh(conveyor2FrameGeometry, conveyor2FrameMaterial)
  conveyor2Frame.position.set(0, 0.55, 4)
  group.add(conveyor2Frame)

  const lightGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.3)
  const lightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
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
