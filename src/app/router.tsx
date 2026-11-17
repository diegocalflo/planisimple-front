import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { LoginPage } from '@/account/LoginPage'
import { activities } from '@/activities/registry'
import { DocumentsPage } from '@/documents/pages/DocumentsPage'
import { RequireAuth } from './guards/RequireAuth'
import { AppLayout } from './layouts/AppLayout'

// Una ruta por actividad del registro. El shell y la actividad se cargan al
// entrar a la ruta, así docx no viaja en el bundle inicial.
const activityRoutes: RouteObject[] = activities.map((entry) => ({
  path: `actividades/${entry.id}/:documentId?`,
  lazy: async () => {
    const [{ default: definition }, { ActivityShell }] = await Promise.all([
      entry.load(),
      import('@/activities/_shared/ActivityShell'),
    ])
    return { Component: () => <ActivityShell entry={entry} definition={definition} /> }
  },
}))

export const router = createBrowserRouter([
  { path: '/ingresar', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DocumentsPage /> },
          ...activityRoutes,
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])
