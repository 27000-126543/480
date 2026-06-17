import * as THREE from 'three'

export function createCookingArea() {
  const group = new THREE.Group()
  group.userData.type = 'cookingArea'

  const baseGeometry = new THREE.BoxGeometry(16, 0.2, 16)
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a2a1a,
    roughness: 0.8,
    metalness: 0.1
  })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = 0.1
  base.receiveShadow = true
  group.add(base)

  const borderGeometry = new THREE.EdgesGeometry(baseGeometry)
  const borderMaterial = new THREE.LineBasicMaterial({ color: 0xfaad14, transparent: true, opacity: 0.6 })
  const border = new THREE.LineSegments(borderGeometry, borderMaterial)
  border.position.y = 0.1
  group.add(border)

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a4a3a,
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
    color: 0xfaad14,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0xfaad14,
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

  const stoveGeometry = new THREE.BoxGeometry(2, 1.2, 1.5)
  const stoveMaterial = new THREE.MeshStandardMaterial({
    color: 0x434343,
    metalness: 0.8,
    roughness: 0.3
  })

  const stovePositions = [
    [-4, 0.6, -4], [0, 0.6, -4], [4, 0.6, -4]
  ]

  stovePositions.forEach((pos, index) => {
    const stove = new THREE.Mesh(stoveGeometry, stoveMaterial)
    stove.position.set(pos[0], pos[1], pos[2])
    stove.castShadow = true
    group.add(stove)

    const burnerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16)
    const burnerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff7a00,
      transparent: true,
      opacity: 0.8
    })
    const burner1 = new THREE.Mesh(burnerGeometry, burnerMaterial)
    burner1.position.set(pos[0] - 0.5, 1.22, pos[2] - 0.3)
    group.add(burner1)

    const burner2 = new THREE.Mesh(burnerGeometry, burnerMaterial)
    burner2.position.set(pos[0] + 0.5, 1.22, pos[2] - 0.3)
    group.add(burner2)

    const potGeometry = new THREE.CylinderGeometry(0.4, 0.35, 0.5, 16)
    const potMaterial = new THREE.MeshStandardMaterial({
      color: 0x595959,
      metalness: 0.9,
      roughness: 0.1
    })
    const pot1 = new THREE.Mesh(potGeometry, potMaterial)
    pot1.position.set(pos[0] - 0.5, 1.5, pos[2] - 0.3)
    pot1.castShadow = true
    group.add(pot1)

    const pot2 = new THREE.Mesh(potGeometry, potMaterial)
    pot2.position.set(pos[0] + 0.5, 1.5, pos[2] - 0.3)
    pot2.castShadow = true
    group.add(pot2)

    const steamGroup = new THREE.Group()
    steamGroup.position.set(pos[0], 0, pos[2])
    for (let i = 0; i < 5; i++) {
      const steamGeometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.1, 8, 8)
      const steamMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4
      })
      const steam = new THREE.Mesh(steamGeometry, steamMaterial)
      steam.position.set(
        (Math.random() - 0.5) * 0.5,
        2 + i * 0.3,
        (Math.random() - 0.5) * 0.5
      )
      steam.userData = { baseY: steam.position.y, offset: Math.random() * Math.PI * 2 }
      steamGroup.add(steam)
    }
    steamGroup.userData.type = 'steam'
    group.add(steamGroup)
  })

  const hoodGeometry = new THREE.BoxGeometry(14, 0.5, 3)
  const hoodMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c8c8c,
    metalness: 0.8,
    roughness: 0.2
  })
  const hood = new THREE.Mesh(hoodGeometry, hoodMaterial)
  hood.position.set(0, 4.5, -3.5)
  hood.castShadow = true
  group.add(hood)

  const hoodFrontGeometry = new THREE.BoxGeometry(14, 1.5, 0.2)
  const hoodFront = new THREE.Mesh(hoodFrontGeometry, hoodMaterial)
  hoodFront.position.set(0, 3.5, -2)
  group.add(hoodFront)

  const ductGeometry = new THREE.BoxGeometry(2, 3, 2)
  const duct = new THREE.Mesh(ductGeometry, hoodMaterial)
  duct.position.set(0, 6.5, -3.5)
  group.add(duct)

  const lightGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.3)
  const lightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd666,
    transparent: true,
    opacity: 0.9
  })
  const lightPositions = [
    [-4, 7.8, 0], [4, 7.8, 0], [0, 7.8, 4]
  ]
  lightPositions.forEach(pos => {
    const light = new THREE.Mesh(lightGeometry, lightMaterial)
    light.position.set(pos[0], pos[1], pos[2])
    group.add(light)
  })

  return group
}
