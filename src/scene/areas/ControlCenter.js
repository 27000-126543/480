import * as THREE from 'three'

export function createControlCenter() {
  const group = new THREE.Group()
  group.userData.type = 'controlCenter'

  const baseGeometry = new THREE.BoxGeometry(16, 0.2, 16)
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a1a2a,
    roughness: 0.7,
    metalness: 0.1
  })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = 0.1
  base.receiveShadow = true
  group.add(base)

  const borderGeometry = new THREE.EdgesGeometry(baseGeometry)
  const borderMaterial = new THREE.LineBasicMaterial({ color: 0xeb2f96, transparent: true, opacity: 0.6 })
  const border = new THREE.LineSegments(borderGeometry, borderMaterial)
  border.position.y = 0.1
  group.add(border)

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a2d4a,
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
    color: 0xeb2f96,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0xeb2f96,
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

  const mainScreenGeometry = new THREE.BoxGeometry(10, 5, 0.1)
  const mainScreenMaterial = new THREE.MeshBasicMaterial({
    color: 0x0a1628,
    transparent: true,
    opacity: 0.9
  })
  const mainScreen = new THREE.Mesh(mainScreenGeometry, mainScreenMaterial)
  mainScreen.position.set(0, 4.5, -6.9)
  group.add(mainScreen)

  const screenFrameGeometry = new THREE.BoxGeometry(10.5, 5.5, 0.2)
  const screenFrameMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f1f1f,
    metalness: 0.8,
    roughness: 0.2
  })
  const screenFrame = new THREE.Mesh(screenFrameGeometry, screenFrameMaterial)
  screenFrame.position.set(0, 4.5, -7)
  group.add(screenFrame)

  const screenGlowGeometry = new THREE.BoxGeometry(11, 6, 0.05)
  const screenGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0xeb2f96,
    transparent: true,
    opacity: 0.2
  })
  const screenGlow = new THREE.Mesh(screenGlowGeometry, screenGlowMaterial)
  screenGlow.position.set(0, 4.5, -6.85)
  group.add(screenGlow)

  const controlDeskGeometry = new THREE.BoxGeometry(8, 1, 2)
  const controlDeskMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f1f1f,
    metalness: 0.7,
    roughness: 0.3
  })
  const controlDesk = new THREE.Mesh(controlDeskGeometry, controlDeskMaterial)
  controlDesk.position.set(0, 0.5, 0)
  controlDesk.castShadow = true
  group.add(controlDesk)

  const deskTopGeometry = new THREE.BoxGeometry(8.2, 0.1, 2.2)
  const deskTopMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d2d2d,
    metalness: 0.6,
    roughness: 0.4
  })
  const deskTop = new THREE.Mesh(deskTopGeometry, deskTopMaterial)
  deskTop.position.set(0, 1.05, 0)
  group.add(deskTop)

  const smallScreenGeometry = new THREE.BoxGeometry(2, 1.2, 0.05)
  const smallScreenMaterial = new THREE.MeshBasicMaterial({
    color: 0x0a1628,
    transparent: true,
    opacity: 0.9
  })
  const smallScreenPositions = [
    [-3, 1.9, 0.8], [-0.5, 1.9, 0.8], [2, 1.9, 0.8]
  ]
  smallScreenPositions.forEach(pos => {
    const screen = new THREE.Mesh(smallScreenGeometry, smallScreenMaterial)
    screen.position.set(pos[0], pos[1], pos[2])
    group.add(screen)

    const standGeometry = new THREE.BoxGeometry(0.1, 0.6, 0.1)
    const standMaterial = new THREE.MeshStandardMaterial({
      color: 0x595959,
      metalness: 0.8,
      roughness: 0.2
    })
    const stand = new THREE.Mesh(standGeometry, standMaterial)
    stand.position.set(pos[0], 1.3, pos[2])
    group.add(stand)
  })

  const keyboardGeometry = new THREE.BoxGeometry(1, 0.05, 0.4)
  const keyboardMaterial = new THREE.MeshStandardMaterial({
    color: 0x434343,
    roughness: 0.8,
    metalness: 0.1
  })
  const keyboardPositions = [
    [-3, 1.1, 0.3], [-0.5, 1.1, 0.3], [2, 1.1, 0.3]
  ]
  keyboardPositions.forEach(pos => {
    const keyboard = new THREE.Mesh(keyboardGeometry, keyboardMaterial)
    keyboard.position.set(pos[0], pos[1], pos[2])
    group.add(keyboard)
  })

  const serverRackGeometry = new THREE.BoxGeometry(2, 6, 1.5)
  const serverRackMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f1f1f,
    metalness: 0.7,
    roughness: 0.3
  })
  const serverRack = new THREE.Mesh(serverRackGeometry, serverRackMaterial)
  serverRack.position.set(5, 3, -4)
  serverRack.castShadow = true
  group.add(serverRack)

  const serverUnitGeometry = new THREE.BoxGeometry(1.8, 0.3, 1.3)
  const serverUnitMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d2d2d,
    metalness: 0.6,
    roughness: 0.4
  })
  for (let i = 0; i < 15; i++) {
    const serverUnit = new THREE.Mesh(serverUnitGeometry, serverUnitMaterial)
    serverUnit.position.set(5, 0.5 + i * 0.4, -4)
    group.add(serverUnit)

    const ledGeometry = new THREE.SphereGeometry(0.03, 8, 8)
    const ledMaterial = new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? 0x52c41a : i % 3 === 1 ? 0x1890ff : 0xfaad14
    })
    const led1 = new THREE.Mesh(ledGeometry, ledMaterial)
    led1.position.set(5.8, 0.5 + i * 0.4, -3.4)
    group.add(led1)
  }

  const conferenceTableGeometry = new THREE.CylinderGeometry(2, 2, 0.1, 32)
  const conferenceTableMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d2d2d,
    metalness: 0.5,
    roughness: 0.5
  })
  const conferenceTable = new THREE.Mesh(conferenceTableGeometry, conferenceTableMaterial)
  conferenceTable.position.set(-4, 0.8, 4)
  conferenceTable.castShadow = true
  group.add(conferenceTable)

  const chairGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16)
  const chairMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f1f1f,
    metalness: 0.6,
    roughness: 0.4
  })
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const chair = new THREE.Mesh(chairGeometry, chairMaterial)
    chair.position.set(
      -4 + Math.cos(angle) * 2.5,
      0.4,
      4 + Math.sin(angle) * 2.5
    )
    chair.castShadow = true
    group.add(chair)
  }

  const lightGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.3)
  const lightMaterial = new THREE.MeshBasicMaterial({
    color: 0xff85c0,
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

  const ceilingDisplayGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.05, 32)
  const ceilingDisplayMaterial = new THREE.MeshBasicMaterial({
    color: 0xeb2f96,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  })
  const ceilingDisplay = new THREE.Mesh(ceilingDisplayGeometry, ceilingDisplayMaterial)
  ceilingDisplay.rotation.x = Math.PI / 2
  ceilingDisplay.position.set(0, 7, 3)
  group.add(ceilingDisplay)

  return group
}
