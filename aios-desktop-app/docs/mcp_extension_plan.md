# MCP Extension System Plan

## Core Goal

Create an Electron app that can discover, configure, and run MCP "extensions" residing in a dedicated folder, using bundled Node.js and Python runtimes.

## Phase 1: Foundational Setup (Directory Structure & Manifest)

1.  **Define Extension Directory:**
    *   **Location:** Application's `userData` path (e.g., `app.getPath('userData') + '/extensions/'`).
    *   **Action:** App checks/creates this directory on first launch.

2.  **Define Extension Folder Structure:**
    ```
    <userData>/
    └── extensions/
        ├── [extension-name-1]/  (e.g., filesystem-mcp)
        │   ├── server.[js|py|exe]   # The main executable script/binary
        │   ├── frontend/            # Folder for UI components
        │   │   ├── index.html       # Main UI page
        │   │   └── ...              # Supporting JS/CSS
        │   ├── manifest.json        # Extension metadata (REQUIRED)
        │   ├── config.json          # Saved configuration (optional, managed by app)
        │   └── node_modules/        # Node dependencies (if needed)
        │   └── venv/                # Python virtual env (if needed)
        │   └── icon.[png|svg]       # Optional icon
        └── [extension-name-2]/
            └── ...
    ```

3.  **Define `manifest.json` Format:**
    *   **Required Fields:**
        *   `name`: (string) Unique identifier (e.g., "filesystem-mcp").
        *   `version`: (string) SemVer (e.g., "1.0.0").
        *   `displayName`: (string) User-friendly name (e.g., "Filesystem Access").
        *   `description`: (string) Brief explanation.
        *   `runtime`: (string) "node" or "python" (determines bundled runtime used).
        *   `executable`: (string) Relative path to the main script/binary (e.g., "server.js").
        *   `frontend`: (string) Relative path to the main HTML UI file (e.g., "frontend/index.html").
    *   **Optional Fields:**
        *   `icon`: (string) Relative path to an icon file.
        *   `configSchema`: (object - JSON Schema) Describes structure/types for configuration (validation/UI generation).
        *   `args`: (array of strings) Default command-line arguments for the executable.

## Phase 2: Extension Discovery & Management (Main Process)

1.  **`ExtensionService` (`src/main/extension-service.ts`):**
    *   Locates `extensions` directory.
    *   Scans for subfolders on startup/demand.
    *   Reads and validates `manifest.json` for each potential extension.
    *   Maintains list of valid, discovered extensions.
    *   Provides API (functions) for listing, getting details, starting/stopping, saving/loading configuration.
    *   Manages running extension processes (`child_process` instances).

2.  **IPC Channels for Extensions:** Define channels for Renderer <-> Main communication:
    *   `extensions:list`: Get discovered extensions.
    *   `extensions:getConfig`: Get saved config for an extension.
    *   `extensions:saveConfig`: Save config for an extension.
    *   `extensions:start`: Start an extension process.
    *   `extensions:stop`: Stop an extension process.
    *   `extensions:selectDirectory`: Use `dialog.showOpenDialog` for config UI needs.
    *   *(Expose via `contextBridge` in a preload script for security)*

## Phase 3: Runtime Integration (Main Process)

1.  **Bundled Runtimes:** Maintain existing setup:
    *   Node.js: `external_runtimes/node-win-x64/` -> `resources/node-runtime`.
    *   Python+UV: `external_runtimes/python-uv-win/` -> `resources/python-uv-runtime`.
    *   *(Ensure `extraResources` in build config is correct)*.

2.  **Path Finding:** `ExtensionService` must reliably get absolute paths to bundled `node.exe` and `python.exe` (using logic similar to `getBundledExePath`).

## Phase 4: Frontend Integration (Main & Renderer Processes)

1.  **Main Application UI:**
    *   Display list of extensions (from `extensions:list`).
    *   Provide buttons: "Configure", "Start", "Stop".

2.  **Loading Extension Frontend ("Configure" Action):**
    *   **Method:** Use Electron `BrowserView` for isolation.
    *   **Steps:**
        *   Create `BrowserView`.
        *   Load extension's HTML (`manifest.frontend`) via `browserView.webContents.loadFile()`.
        *   Attach a dedicated preload script to the `BrowserView` for secure IPC access to `extensions:*` channels.
        *   Attach `BrowserView` to main window (`mainWindow.addBrowserView()`), position/size it.
        *   Extension frontend uses `ipcRenderer` (via preload) to interact with `ExtensionService` for config.

## Phase 5: Configuration Handling (Main Process & Extension Frontend)

1.  **Saving Config (`extensions:saveConfig`):**
    *   `ExtensionService` receives data from extension frontend via IPC.
    *   Validates data (optional: use `manifest.configSchema`).
    *   Saves persistently (e.g., write to `<extensionDir>/config.json`).

2.  **Loading Config (`extensions:getConfig`):**
    *   `ExtensionService` reads `<extensionDir>/config.json` or returns defaults.
    *   Sends data back to extension frontend via IPC.

3.  **Passing Config to MCP Executable:** When starting (Phase 6):
    *   `ExtensionService` retrieves saved config.
    *   Formats config into command-line arguments (e.g., `--path D:/ --path C:/`).
    *   *(Alternative methods: environment variables, stdin - command-line args often simplest)*.

## Phase 6: Launching the MCP Extension (Main Process)

1.  **Start Action (`extensions:start`):**
    *   `ExtensionService` finds manifest and saved config.
    *   Gets bundled runtime path (`node.exe`/`python.exe`) based on `manifest.runtime`.
    *   Gets absolute path to extension executable (`join(extensionDir, manifest.executable)`).
    *   Prepares arguments array (default `manifest.args` + config-derived args).
    *   Uses `child_process.spawn`:\
        ```typescript
        const runtimePath = (manifest.runtime === 'node') ? bundledNodePath : bundledPythonPath;
        const scriptPath = path.join(extensionDir, manifest.executable);
        const args = [...(manifest.args || []), ...configArgs];
        const cwd = extensionDir; // Run from extension's directory

        const process = spawn(runtimePath, [scriptPath, ...args], { cwd: cwd /*, env: ... */ });
        ```
    *   Store `process` instance (e.g., in a Map) for management.
    *   Handle `stdout`, `stderr`, `error`, `close` events for logging and status updates.

2.  **Stop Action (`extensions:stop`):**
    *   `ExtensionService` finds stored `process` for the extension.
    *   Calls `process.kill()`.
    *   Removes process from tracked list, updates status.

## Phase 7: Packaging & First Run

1.  **Electron Builder:** Ensure `extraResources` copies runtimes correctly.
2.  **First Run Logic:** Add code to main process (e.g., on `app.ready`) to check/create `userData/extensions` directory.
3.  **Initial Extensions:** Manually copy prepared extension folders into `userData/extensions` after installation for initial testing.

## Phase 8: Iteration & Future Considerations

*   **Start Simple:** Focus on discovery, basic config UI, and launching first.
*   **Dependencies:** Decide how extensions handle `node_modules`/`pip` packages:
    *   **Option A (Simple):** Require bundling (larger extensions, self-contained).
    *   **Option B (Complex):** `ExtensionService` runs `npm install`/`uv pip install` post-download (more complex, network needed, potential build failures).
*   **Communication with Running MCPs:** If the main app needs to talk to launched MCPs, they need a communication protocol (stdio, HTTP). `MCPClientService` might need to be integrated dynamically based on launched processes.
*   **Extension Installation UI:** Build UI to download/unzip/manage extensions.
*   **Security:** Carefully consider security implications of running external code. Use `BrowserView` with strict preloads, validate manifests and config.
