export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <h1 className='text-2xl font-semibold text-gray-900'>{title}</h1>
          <p className='text-gray-500 mt-2'>{subtitle}</p>
        </div>
        <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>{children}</div>
      </div>
    </div>
  )
}
