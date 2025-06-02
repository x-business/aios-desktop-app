import "./App.css";
import { Thread } from "@/components/thread";
import { ConnectionGuard } from "@/components/ConnectionGuard";
<<<<<<< HEAD
=======
import { useEffect } from "react";
import { useToolStore } from "./stores/toolStore";
import { initializeAndListenRemoteIntegrations } from "./stores/remoteIntegrationsStore";
import { usePipedreamSettingsStore } from "./stores/settingsStore";
>>>>>>> 06be5ac67a6916c6de8ec7be32a127d1bdb4e417
import { Routes, Route } from "react-router-dom";
import SettingsPage from "@/pages/SettingsPage";
import { AuthProvider } from '@/providers/AuthProvider';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { useAuth } from '@/providers/AuthProvider';

function AuthenticatedApp() {
  const { authState } = useAuth();

<<<<<<< HEAD
  if (!authState.isAuthenticated) {
    return <AuthScreen />;
  }
=======
  useEffect(() => {
    console.log('[App] Initializing tool listener and fetching initial tools...');
    initializeListener();
    fetchActiveTools();
    
    // Initialize remote integrations store
    console.log('[App] Initializing remote integrations store...');
    initializeAndListenRemoteIntegrations();
    
    return () => {
      console.log('[App] Cleaning up tool listener...');
      cleanupListener();
    };
    // Empty dependency array ensures this runs only once on mount/unmount
  }, [initializeListener, cleanupListener, fetchActiveTools]);
>>>>>>> 06be5ac67a6916c6de8ec7be32a127d1bdb4e417

  // New useEffect for initializing enabled remote integrations
  const pipedreamUserId = usePipedreamSettingsStore(state => state.pipedreamUserId);
  useEffect(() => {
    if (pipedreamUserId) {
      console.log('[App] Initializing all enabled remote integrations for user:', pipedreamUserId);
      if (window.remoteIntegrations && window.remoteIntegrations.initializeAllEnabled) {
        window.remoteIntegrations.initializeAllEnabled(pipedreamUserId)
          .then(() => {
            console.log('[App] Successfully initialized enabled remote integrations.');
          })
          .catch(error => {
            console.error('[App] Error initializing enabled remote integrations:', error);
          });
      } else {
        console.warn('[App] remoteIntegrations API or initializeAllEnabled method not found on window object.');
      }
    } else {
      console.log('[App] No Pipedream User ID found, skipping remote integrations initialization.');
    }
  }, [pipedreamUserId]); // Rerun if pipedreamUserId changes

  return (
    <Routes>
      <Route path="/" element={
        <ConnectionGuard>
          <Thread />
        </ConnectionGuard>
      } />
      <Route path="/settings/*" element={<SettingsPage />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
