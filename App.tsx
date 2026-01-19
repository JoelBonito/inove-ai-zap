import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { AuthProvider } from './hooks/useAuth';
import { InstanceStatusProvider } from './hooks/useInstanceStatus';
import { CampaignsProvider } from './hooks/useCampaigns';
import { ContactsProvider } from './hooks/useContacts';
import { CategoriesProvider } from './hooks/useCategories';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import CampaignDetails from './pages/CampaignDetails';
import Contacts from './pages/Contacts';
import Settings from './pages/Settings';
import Connection from './pages/Connection';
import Login from './pages/Login';
import { useAuth } from './hooks/useAuth';
import { useThemeEffect } from './hooks/useThemeEffect';

const queryClient = new QueryClient();

const ProtectedLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
};

const App: React.FC = () => {
  useThemeEffect();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InstanceStatusProvider>
          <CampaignsProvider>
            <ContactsProvider>
              <CategoriesProvider>
                <HashRouter>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<ProtectedLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="campaigns" element={<Campaigns />} />
                      <Route path="campaigns/:campaignId" element={<CampaignDetails />} />
                      <Route path="contacts" element={<Contacts />} />
                      <Route path="connection" element={<Connection />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </HashRouter>
              </CategoriesProvider>
            </ContactsProvider>
          </CampaignsProvider>
        </InstanceStatusProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
