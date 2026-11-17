import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { AuthProvider } from '@/account/AuthProvider'
import { isApiError } from '@/api/errors'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Los errores 4xx del backend son definitivos; solo se reintentan red y 5xx.
        retry: (failureCount, error) => failureCount < 2 && !(isApiError(error) && error.status < 500),
        refetchOnWindowFocus: false,
      },
    },
  })
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
