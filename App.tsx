import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider } from './hooks/useAuth';
import { InstanceStatusProvider } from './hooks/useInstanceStatus';
import { CampaignsProvider } from './hooks/useCampaigns';
import { ContactsProvider } from './hooks/useContacts';
import { CategoriesProvider } from './hooks/useCategories';
import { UIProvider } from './hooks/useUI';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import CampaignDetails from './pages/CampaignDetails';
import Contacts from './pages/Contacts';
import Settings from './pages/Settings';
import Connection from './pages/Connection';
import Login from './pages/Login';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <InstanceStatusProvider>
        <UIProvider>
          <CampaignsProvider>
            <ContactsProvider>
              <CategoriesProvider>
                <HashRouter>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<Layout />}>
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
        </UIProvider>
      </InstanceStatusProvider>
    </AuthProvider>
  );
};

export default App;