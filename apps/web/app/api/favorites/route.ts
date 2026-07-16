import { proxyToApi } from '@/lib/api/proxy-request'

export async function GET() {
  return proxyToApi('/favorites?page=1&limit=50')
}
