import * as THREE from 'three'

export class AirflowSystem {
  constructor(scene) {
    this.scene = scene
    this.particles = []
    this.active = false
    this.flowPaths = []
  }

  start() {
    if (this.active) return
    this.active = true
    this.createFlowPaths()
    this.createParticles()
  }

  stop() {
    this.active = false
    this.clearParticles()
    this.clearPaths()
  }

  createFlowPaths() {
    const areas = [
      { start: new THREE.Vector3(-25, 7, -15), end: new THREE.Vector3(-25, 1, -15) },
      { start: new THREE.Vector3(-5, 7, -15), end: new THREE.Vector3(-5, 1, -15) },
      { start: new THREE.Vector3(15, 7, -15), end: new THREE.Vector3(15, 1, -15) },
      { start: new THREE.Vector3(-25, 7, 10), end: new THREE.Vector3(-25, 1, 10) },
      { start: new THREE.Vector3(-5, 7, 10), end: new THREE.Vector3(-5, 1, 10) },
      { start: new THREE.Vector3(15, 7, 10), end: new THREE.Vector3(15, 1, 10) }
    ]

    areas.forEach(area => {
      const points = []
      for (let i = 0; i <= 20; i++) {
        const t = i / 20
        const x = area.start.x + (Math.random() - 0.5) * 2
        const y = area.start.y + (area.end.y - area.start.y) * t
        const z = area.start.z + (Math.random() - 0.5) * 2
        points.push(new THREE.Vector3(x, y, z))
      }

      const curve = new THREE.CatmullRomCurve3(points)
      this.flowPaths.push({
        curve,
        area,
        particles: []
      })

      const geometry = new THREE.TubeGeometry(curve, 20, 0.02, 8, false)
      const material = new THREE.MeshBasicMaterial({
        color: 0x1890ff,
        transparent: true,
        opacity: 0.2
      })
      const tube = new THREE.Mesh(geometry, material)
      tube.userData.type = 'airflowPath'
      this.scene.add(tube)
    })
  }

  createParticles() {
    this.flowPaths.forEach((path, pathIndex) => {
      for (let i = 0; i < 15; i++) {
        const geometry = new THREE.SphereGeometry(0.08, 8, 8)
        const material = new THREE.MeshBasicMaterial({
          color: 0x1890ff,
          transparent: true,
          opacity: 0.6
        })
        const particle = new THREE.Mesh(geometry, material)
        particle.userData = {
          type: 'airflowParticle',
          pathIndex,
          progress: i / 15,
          speed: 0.3 + Math.random() * 0.2
        }
        
        const point = path.curve.getPoint(particle.userData.progress)
        particle.position.copy(point)
        
        this.scene.add(particle)
        this.particles.push(particle)
        path.particles.push(particle)
      }
    })
  }

  update(delta, elapsed) {
    if (!this.active) return

    this.particles.forEach(particle => {
      const userData = particle.userData
      userData.progress += delta * userData.speed
      
      if (userData.progress > 1) {
        userData.progress = 0
      }

      const path = this.flowPaths[userData.pathIndex]
      if (path) {
        const point = path.curve.getPoint(userData.progress)
        const offset = new THREE.Vector3(
          Math.sin(elapsed * 2 + userData.progress * 10) * 0.3,
          0,
          Math.cos(elapsed * 2 + userData.progress * 10) * 0.3
        )
        particle.position.copy(point).add(offset)
        
        const scale = 0.5 + Math.sin(elapsed * 3 + userData.progress * 5) * 0.3
        particle.scale.setScalar(scale)
        particle.material.opacity = 0.3 + Math.sin(elapsed * 2 + userData.progress) * 0.3
      }
    })

    this.flowPaths.forEach((path, index) => {
      path.particles.forEach((particle, i) => {
        const nextParticle = path.particles[(i + 1) % path.particles.length]
        const distance = particle.position.distanceTo(nextParticle.position)
        if (distance < 1) {
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            particle.position,
            nextParticle.position
          ])
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x1890ff,
            transparent: true,
            opacity: 0.1
          })
          const line = new THREE.Line(lineGeometry, lineMaterial)
          this.scene.add(line)
          setTimeout(() => this.scene.remove(line), 100)
        }
      })
    })
  }

  clearParticles() {
    this.particles.forEach(particle => {
      this.scene.remove(particle)
    })
    this.particles = []
    this.flowPaths.forEach(path => {
      path.particles = []
    })
  }

  clearPaths() {
    const toRemove = []
    this.scene.traverse(obj => {
      if (obj.userData && obj.userData.type === 'airflowPath') {
        toRemove.push(obj)
      }
    })
    toRemove.forEach(obj => this.scene.remove(obj))
    this.flowPaths = []
  }

  isActive() {
    return this.active
  }
}
