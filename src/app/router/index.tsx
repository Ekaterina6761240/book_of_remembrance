import { Navigate, createBrowserRouter } from 'react-router-dom';
import { appConfig } from '../config';
import { ScreenLayout } from '../../screen/components/ScreenLayout';
import { ScreenDistrictsPage } from '../../screen/pages/ScreenDistrictsPage';
import { ScreenHeroPage } from '../../screen/pages/ScreenHeroPage';
import { ScreenHeroesPage } from '../../screen/pages/ScreenHeroesPage';
import { ScreenHomePage } from '../../screen/pages/ScreenHomePage';
import { StaffLayout } from '../../staff/components/StaffLayout';
import { StaffDashboardPage } from '../../staff/pages/StaffDashboardPage';
import { StaffDistrictsPage } from '../../staff/pages/StaffDistrictsPage';
import { StaffHeroFormPage } from '../../staff/pages/StaffHeroFormPage';
import { StaffHeroesPage } from '../../staff/pages/StaffHeroesPage';
import { StaffLoginPage } from '../../staff/pages/StaffLoginPage';
import { StaffMediaPage } from '../../staff/pages/StaffMediaPage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter(
  [
    { path: '/', element: <Navigate replace to="/screen" /> },
    {
      path: '/screen',
      element: <ScreenLayout />,
      children: [
        { index: true, element: <ScreenHomePage /> },
        { path: 'districts', element: <ScreenDistrictsPage /> },
        { path: 'heroes', element: <ScreenHeroesPage /> },
        { path: 'heroes/:id', element: <ScreenHeroPage /> },
      ],
    },
    { path: '/staff/login', element: <StaffLoginPage /> },
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: '/staff',
          element: <StaffLayout />,
          children: [
            { index: true, element: <StaffDashboardPage /> },
            { path: 'districts', element: <StaffDistrictsPage /> },
            { path: 'heroes', element: <StaffHeroesPage /> },
            { path: 'heroes/new', element: <StaffHeroFormPage /> },
            { path: 'heroes/:id', element: <StaffHeroFormPage /> },
            { path: 'media', element: <StaffMediaPage /> },
          ],
        },
      ],
    },
    { path: '*', element: <Navigate replace to="/screen" /> },
  ],
  { basename: appConfig.basePath },
);
