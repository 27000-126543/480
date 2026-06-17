import { reactive, ref } from 'vue'

class AuthManager {
  constructor() {
    this.currentUser = ref(null)
    this.users = reactive([])
    this.permissions = reactive({})
    this.loginLogs = reactive([])
    this.operationLogs = reactive([])
    this.faceRecognitionStatus = 'idle'
    this.initMockData()
  }

  initMockData() {
    this.users = reactive([
      {
        id: 'U001',
        username: 'operator1',
        name: '操作员-张三',
        role: 'operator',
        roleName: '操作员',
        avatar: null,
        faceData: 'face_data_operator1',
        phone: '138****1111',
        email: 'operator1@kitchen.com',
        status: 'active',
        lastLogin: new Date(Date.now() - 86400000),
        department: '生产部',
        permissions: ['view_dashboard', 'view_workstation', 'report_issue', 'view_my_tasks']
      },
      {
        id: 'U002',
        username: 'quality1',
        name: '品控员-李四',
        role: 'quality',
        roleName: '品控',
        avatar: null,
        faceData: 'face_data_quality1',
        phone: '138****2222',
        email: 'quality1@kitchen.com',
        status: 'active',
        lastLogin: new Date(Date.now() - 43200000),
        department: '品控部',
        permissions: ['view_dashboard', 'view_workstation', 'view_inventory', 'approve_quality', 'report_issue', 'view_reports', 'quality_check']
      },
      {
        id: 'U003',
        username: 'manager1',
        name: '运营经理-王五',
        role: 'manager',
        roleName: '经理',
        avatar: null,
        faceData: 'face_data_manager1',
        phone: '138****3333',
        email: 'manager1@kitchen.com',
        status: 'active',
        lastLogin: new Date(Date.now() - 21600000),
        department: '运营部',
        permissions: ['view_dashboard', 'view_workstation', 'view_inventory', 'manage_orders', 'approve_warehouse', 'approve_quality', 'manage_equipment', 'view_reports', 'export_reports', 'manage_scheduling', 'manage_users']
      },
      {
        id: 'U004',
        username: 'director1',
        name: '运营总监-赵六',
        role: 'director',
        roleName: '总监',
        avatar: null,
        faceData: 'face_data_director1',
        phone: '138****4444',
        email: 'director1@kitchen.com',
        status: 'active',
        lastLogin: new Date(Date.now() - 7200000),
        department: '总经办',
        permissions: ['*']
      }
    ])

    this.permissions = reactive({
      operator: {
        name: '操作员',
        level: 1,
        description: '一线操作人员，可查看工位信息和上报问题',
        menus: ['dashboard', 'workstations', 'my_tasks'],
        color: '#52c41a'
      },
      quality: {
        name: '品控',
        level: 2,
        description: '品质控制人员，负责质量检查和审批',
        menus: ['dashboard', 'workstations', 'inventory', 'quality_check', 'reports'],
        color: '#1890ff'
      },
      manager: {
        name: '经理',
        level: 3,
        description: '运营管理人员，负责调度和审批',
        menus: ['dashboard', 'workstations', 'inventory', 'orders', 'equipment', 'scheduling', 'reports'],
        color: '#722ed1'
      },
      director: {
        name: '总监',
        level: 4,
        description: '最高管理员，拥有所有权限',
        menus: ['dashboard', 'workstations', 'inventory', 'orders', 'equipment', 'coldchain', 'scheduling', 'reports', 'system', 'users'],
        color: '#eb2f96'
      }
    })

    for (let i = 0; i < 20; i++) {
      this.loginLogs.push({
        id: `LOG${String(i + 1).padStart(5, '0')}`,
        userId: this.users[i % 4].id,
        username: this.users[i % 4].username,
        name: this.users[i % 4].name,
        role: this.users[i % 4].role,
        loginTime: new Date(Date.now() - (i + 1) * 3600000 * 2),
        loginMethod: i % 3 === 0 ? 'face' : 'password',
        status: i % 5 === 0 ? 'failed' : 'success',
        ip: `192.168.1.${100 + i}`,
        device: 'Chrome/Windows 10'
      })
    }

    for (let i = 0; i < 30; i++) {
      this.operationLogs.push({
        id: `OP${String(i + 1).padStart(5, '0')}`,
        userId: this.users[i % 4].id,
        username: this.users[i % 4].username,
        name: this.users[i % 4].name,
        role: this.users[i % 4].role,
        action: ['查看工位信息', '修改订单状态', '审批补货申请', '创建工单', '导出报表', '修改设备状态'][i % 6],
        target: ['W001工位', 'ORD00012订单', 'REQ001申请', 'WO001工单', '生产日报', 'EQ005设备'][i % 6],
        time: new Date(Date.now() - (i + 1) * 1800000),
        result: i % 7 === 0 ? 'failed' : 'success',
        ip: `192.168.1.${100 + (i % 10)}`
      })
    }
  }

  login(username, password) {
    const user = this.users.find(u => u.username === username)
    if (user && user.status === 'active') {
      this.currentUser = reactive({ ...user })
      this.recordLoginLog(user, 'password', 'success')
      user.lastLogin = new Date()
      return { success: true, user: this.currentUser }
    }
    this.recordLoginLog({ username }, 'password', 'failed')
    return { success: false, message: '用户名或密码错误' }
  }

  faceLogin(faceData) {
    this.faceRecognitionStatus = 'recognizing'
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = this.users.find(u => u.faceData === faceData)
        if (user && user.status === 'active') {
          this.currentUser = reactive({ ...user })
          this.recordLoginLog(user, 'face', 'success')
          user.lastLogin = new Date()
          this.faceRecognitionStatus = 'success'
          resolve({ success: true, user: this.currentUser })
        } else {
          this.faceRecognitionStatus = 'failed'
          this.recordLoginLog({ username: 'unknown' }, 'face', 'failed')
          resolve({ success: false, message: '人脸识别失败' })
        }
      }, 1500)
    })
  }

  startFaceRecognition() {
    this.faceRecognitionStatus = 'recognizing'
  }

  stopFaceRecognition() {
    this.faceRecognitionStatus = 'idle'
  }

  recordLoginLog(user, method, status) {
    this.loginLogs.unshift({
      id: `LOG${String(Date.now()).slice(-8)}`,
      userId: user.id || null,
      username: user.username || 'unknown',
      name: user.name || '未知用户',
      role: user.role || null,
      loginTime: new Date(),
      loginMethod: method,
      status,
      ip: '192.168.1.100',
      device: navigator.userAgent.slice(0, 100)
    })

    if (this.loginLogs.length > 500) {
      this.loginLogs.pop()
    }
  }

  recordOperationLog(action, target, result = 'success') {
    if (!this.currentUser) return

    this.operationLogs.unshift({
      id: `OP${String(Date.now()).slice(-8)}`,
      userId: this.currentUser.id,
      username: this.currentUser.username,
      name: this.currentUser.name,
      role: this.currentUser.role,
      action,
      target,
      time: new Date(),
      result,
      ip: '192.168.1.100'
    })

    if (this.operationLogs.length > 1000) {
      this.operationLogs.pop()
    }
  }

  logout() {
    if (this.currentUser) {
      this.recordOperationLog('退出系统', '', 'success')
    }
    this.currentUser = null
    this.faceRecognitionStatus = 'idle'
  }

  hasPermission(permission) {
    if (!this.currentUser) return false
    if (this.currentUser.permissions.includes('*')) return true
    return this.currentUser.permissions.includes(permission)
  }

  hasRole(role) {
    if (!this.currentUser) return false
    const roleLevels = { operator: 1, quality: 2, manager: 3, director: 4 }
    const userLevel = roleLevels[this.currentUser.role] || 0
    const requiredLevel = roleLevels[role] || 0
    return userLevel >= requiredLevel
  }

  getUsers() {
    return [...this.users]
  }

  getUserById(userId) {
    return this.users.find(u => u.id === userId)
  }

  getRoleInfo(role) {
    return this.permissions[role] || null
  }

  getLoginLogs(page = 1, pageSize = 20) {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return {
      list: this.loginLogs.slice(start, end),
      total: this.loginLogs.length
    }
  }

  getOperationLogs(page = 1, pageSize = 20) {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return {
      list: this.operationLogs.slice(start, end),
      total: this.operationLogs.length
    }
  }

  updateUser(userId, updates) {
    const user = this.users.find(u => u.id === userId)
    if (user) {
      Object.assign(user, updates)
      if (this.currentUser && this.currentUser.id === userId) {
        Object.assign(this.currentUser, updates)
      }
      return true
    }
    return false
  }

  getRoleList() {
    return Object.entries(this.permissions).map(([key, value]) => ({
      key,
      ...value
    }))
  }
}

export const authManager = new AuthManager()
