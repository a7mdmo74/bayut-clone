import { proxyToApi } from '@/lib/api/proxy-request'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params
  return proxyToApi(`/favorites/${propertyId}`, { method: 'POST' })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params
  return proxyToApi(`/favorites/${propertyId}`, { method: 'DELETE' })
}
