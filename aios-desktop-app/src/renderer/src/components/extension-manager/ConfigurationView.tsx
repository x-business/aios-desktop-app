import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ConfigurationViewProps {
  extensionId: string;
  onBack: () => void;
  handleToggleEnable: (extensionId: string, enable: boolean) => Promise<void>;
}

export function ConfigurationView({ extensionId, onBack, handleToggleEnable }: ConfigurationViewProps) {
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const [configPreloadPath, setConfigPreloadPath] = useState<string | null>(null);
  const [preloadPathError, setPreloadPathError] = useState<string | null>(null);

  // Fetch the preload path when the component mounts
  useEffect(() => {
    let isMounted = true;

    window.api.getConfigPreloadPath()
      .then(path => {
        if (isMounted) {
          console.log("[Renderer] Received config preload path:", path);
          setConfigPreloadPath(path);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error("[Renderer] Failed to get config preload path:", err);
          setPreloadPathError(err.message || "Failed to get preload path.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Setup event listeners for the webview
  useEffect(() => {
    const webview = webviewRef.current;
    console.log("[Renderer] WebviewRef.current:", webview);
    if (!webview || !extensionId) return;

    console.log(`[Renderer] Attaching listeners to webview for ${extensionId}`);

    const handleIPCMessage = (event: Electron.IpcMessageEvent) => {
      // Log ALL messages received from the webview
      console.log(`[Renderer] <<< IPC Message FROM Webview: Channel=${event.channel} Args=`, event.args);

      if (event.channel === 'config-save-success') {
        console.log('[Renderer] ---> Matched \'config-save-success\' channel.');
        console.log('[Renderer] Calling onBack()...');
        onBack();
        console.log('[Renderer] Calling handleToggleEnable(extensionId, true)...');
        handleToggleEnable(extensionId, true);
      } else if (event.channel === 'close-my-config-view') {
        console.log('[Renderer] ---> Matched \'close-my-config-view\' channel.');
        console.log('[Renderer] Calling onBack()...');
        onBack();
      } else {
        console.log('[Renderer] ---> Unmatched IPC message channel.');
      }
    };

    const handleLoadError = (event: Electron.DidFailLoadEvent) => {
      console.error(`[Renderer] Webview failed to load: ${event.errorCode}, ${event.errorDescription}`);
      setPreloadPathError(`Failed to load configuration UI: ${event.errorDescription} (${event.errorCode})`);
      onBack();
    };

    webview.addEventListener('ipc-message', handleIPCMessage);
    webview.addEventListener('did-fail-load', handleLoadError);

    // UNCOMMENT FOR: Opening DevTools for the webview for debugging
    /*webview.addEventListener('dom-ready', () => {
      console.log("[Renderer] Webview DOM ready. Opening DevTools...");
      webview.openDevTools();

    });*/



    return () => {
      if (webviewRef.current) {
        webviewRef.current.removeEventListener('ipc-message', handleIPCMessage);
        webviewRef.current.removeEventListener('did-fail-load', handleLoadError);
      }
    };
  }, [extensionId, onBack, handleToggleEnable, configPreloadPath]);

  return (
    <div className="flex-1 flex flex-col border border-border rounded-md overflow-hidden min-h-0">
      <div className="flex items-center p-2 border-b border-border bg-muted/40">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mr-2"
          title="Back to extensions list"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h3 className="text-lg font-medium">Configure Extension: {extensionId}</h3>
      </div>

      {!configPreloadPath && !preloadPathError && (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
          Loading Preload Info...
        </div>
      )}

      {preloadPathError && (
        <Alert variant="destructive" className="m-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Configuration</AlertTitle>
          <AlertDescription>{preloadPathError}</AlertDescription>
        </Alert>
      )}

      {configPreloadPath && !preloadPathError && (
        <webview
          ref={webviewRef}
          src={`ext-asset://${extensionId}`}
          preload={configPreloadPath}
          style={{ flex: 1, width: '100%', border: 'none' }}
          webpreferences="contextIsolation=true,sandbox=false,nodeIntegration=false"
        />
      )}
    </div>
  );
} 