import * as THREE from 'three'

export function createStorageArea() {
  const group = new THREE.Group()
  group.userData.type = 'storageArea'

  const baseGeometry = new THREE.BoxGeometry(16, 0.2, 16)
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    roughness: 0.7,
    metalness: 0.1
  })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = 0.1
  base.receiveShadow = true
  group.add(base)

  const borderGeometry = new THREE.EdgesGeometry(baseGeometry)
  const borderMaterial = new THREE.LineBasicMaterial({ color: 0x1890ff, transparent: true, opacity: 0.6 })
  const border = new THREE.LineSegments(borderGeometry, borderMaterial)
  border.position.y = 0.1
  group.add(border)

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d4a6e,
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

  const roofGeometry = new THREE.BoxGeometry(16, 0.2, 16)
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    transparent: true,
    opacity: 0.3
  })
  const roof = new THREE.Mesh(roofGeometry, roofMaterial)
  roof.position.y = 8.1
  group.add(roof)

  const pillarGeometry = new THREE.CylinderGeometry(0.15, 0.15, 8, 8)
  const pillarMaterial = new THREE.MeshStandardMaterial({
    color: 0x1890ff,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x1890ff,
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

  const coolerGeometry = new THREE.BoxGeometry(3, 4, 2)
  const coolerMaterial = new THREE.MeshStandardMaterial({
    color: 0x40a9ff,
    metalness: 0.5,
    roughness: 0.3,
    emissive: 0x0050b3,
    emissiveIntensity: 0.1
  })
  const cooler = new THREE.Mesh(coolerGeometry, coolerMaterial)
  cooler.position.set(0, 2, 5)
  cooler.castShadow = true
  group.add(cooler)

  const coolerDisplayGeometry = new THREE.BoxGeometry(2.5, 1.5, 0.1)
  const coolerDisplayMaterial = new THREE.MeshBasicMaterial({ color: 0x1890ff, transparent: true, opacity: 0.8 })
  const coolerDisplay = new THREE.Mesh(coolerDisplayGeometry, coolerDisplayMaterial)
  coolerDisplay.position.set(0, 2.5, 6.06)
  group.add(coolerDisplay)

  const hvacGeometry = new THREE.BoxGeometry(4, 1, 1.5)
  const hvacMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c8c8c,
    metalness: 0.7,
    roughness: 0.3
  })
  const hvac = new THREE.Mesh(hvacGeometry, hvacMaterial)
  hvac.position.set(0, 7.5, 0)
  group.add(hvac)

  const ventGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16)
  const ventMaterial = new THREE.MeshStandardMaterial({
    color: 0x595959,
    metalness: 0.8,
    roughness: 0.2
  })
  const vent = new THREE.Mesh(ventGeometry, ventMaterial)
  vent.rotation.x = Math.PI / 2
  vent.position.set(0, 7.3, 0)
  group.add(vent)

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
