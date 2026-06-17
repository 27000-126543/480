import * as THREE from 'three'

export function createProcessingArea() {
  const group = new THREE.Group()
  group.userData.type = 'processingArea'

  const baseGeometry = new THREE.BoxGeometry(16, 0.2, 16)
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e3a2e,
    roughness: 0.7,
    metalness: 0.1
  })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = 0.1
  base.receiveShadow = true
  group.add(base)

  const borderGeometry = new THREE.EdgesGeometry(baseGeometry)
  const borderMaterial = new THREE.LineBasicMaterial({ color: 0x52c41a, transparent: true, opacity: 0.6 })
  const border = new THREE.LineSegments(borderGeometry, borderMaterial)
  border.position.y = 0.1
  group.add(border)

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d5a4a,
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
    color: 0x52c41a,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x52c41a,
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

  const sinkGeometry = new THREE.BoxGeometry(3, 1.5, 2)
  const sinkMaterial = new THREE.MeshStandardMaterial({
    color: 0xe6e6e6,
    metalness: 0.9,
    roughness: 0.1
  })
  const sink = new THREE.Mesh(sinkGeometry, sinkMaterial)
  sink.position.set(0, 0.75, 5)
  sink.castShadow = true
  group.add(sink)

  const sinkBasinGeometry = new THREE.BoxGeometry(2.5, 0.3, 1.5)
  const sinkBasinMaterial = new THREE.MeshStandardMaterial({
    color: 0x1890ff,
    metalness: 0.8,
    roughness: 0.2,
    transparent: true,
    opacity: 0.7
  })
  const sinkBasin = new THREE.Mesh(sinkBasinGeometry, sinkBasinMaterial)
  sinkBasin.position.set(0, 1.4, 5)
  group.add(sinkBasin)

  const conveyorGeometry = new THREE.BoxGeometry(10, 0.3, 1)
  const conveyorMaterial = new THREE.MeshStandardMaterial({
    color: 0x434343,
    roughness: 0.9,
    metalness: 0.1
  })
  const conveyor = new THREE.Mesh(conveyorGeometry, conveyorMaterial)
  conveyor.position.set(0, 0.8, 0)
  conveyor.castShadow = true
  group.add(conveyor)

  const conveyorFrameGeometry = new THREE.BoxGeometry(10.2, 0.5, 1.2)
  const conveyorFrameMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c8c8c,
    metalness: 0.7,
    roughness: 0.3
  })
  const conveyorFrame = new THREE.Mesh(conveyorFrameGeometry, conveyorFrameMaterial)
  conveyorFrame.position.set(0, 0.55, 0)
  group.add(conveyorFrame)

  const rollerGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.1, 8)
  const rollerMaterial = new THREE.MeshStandardMaterial({
    color: 0x595959,
    metalness: 0.8,
    roughness: 0.2
  })
  for (let i = -4; i <= 4; i += 1) {
    const roller = new THREE.Mesh(rollerGeometry, rollerMaterial)
    roller.rotation.z = Math.PI / 2
    roller.position.set(i, 0.8, 0)
    group.add(roller)
  }

  const peelerGeometry = new THREE.BoxGeometry(1.5, 1.2, 1)
  const peelerMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9d9d9,
    metalness: 0.6,
    roughness: 0.4
  })
  const peeler = new THREE.Mesh(peelerGeometry, peelerMaterial)
  peeler.position.set(-5, 0.6, -4)
  peeler.castShadow = true
  group.add(peeler)

  const cutterGeometry = new THREE.BoxGeometry(1.5, 1, 1.2)
  const cutterMaterial = new THREE.MeshStandardMaterial({
    color: 0xbfbfbf,
    metalness: 0.7,
    roughness: 0.3
  })
  const cutter = new THREE.Mesh(cutterGeometry, cutterMaterial)
  cutter.position.set(5, 0.5, -4)
  cutter.castShadow = true
  group.add(cutter)

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
