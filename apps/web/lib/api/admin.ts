import { serverFetch } from './server'

export interface AdminDashboardStats {
  totalUsers: number
  totalAgents: number
  totalProperties: number
  totalRevenue: number
}

export function getAdminDashboardStats() {
  return serverFetch<AdminDashboardStats>('/admin/dashboard/stats')
}

export interface AdminActivity {
  id: string
  action: string
  user: string
  time: string
}

export function getAdminRecentActivity() {
  return serverFetch<AdminActivity[]>('/admin/activity')
}
