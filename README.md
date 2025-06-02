# AIOS Monorepo

This repository contains the AIOS (Artificial Intelligence Operating System) project, split into a frontend desktop application and a backend LangGraph server.

## Project Structure

-   `/aios-desktop-app`: Contains the Electron-based frontend application.
-   `/aios-langgraph-server`: Contains the Python-based LangGraph backend server.

## Prerequisites

Before you begin, ensure you have the following installed:

-   **Node.js** (LTS version recommended) and **npm**: For the desktop application.
-   **Python** (version 3.12.4 recommended) and **pip**: For the backend server.
-   **uv**: A Python package manager.

## Setup and Running

You'll need to set up and run each project in separate terminal sessions.

### 1. AIOS LangGraph Server (Backend)

The backend server provides the core AI functionalities and exposes them via an API, which the desktop application consumes.

**Setup:**

1.  Navigate to the backend directory:
    ```bash
    cd aios-langgraph-server
    ```
2.  Create your environment configuration file:
    Copy `.env.example` to a new file named `.env`.
    ```bash
    cp .env.example .env
    ```
    Then, open `.env` and fill in the necessary environment-specific variables (e.g., API keys, database credentials).
3.  Create and activate a Python virtual environment using `uv`:
    ```bash
    uv venv
    # On macOS/Linux:
    source .venv/bin/activate
    # On Windows:
    .venv\Scripts\activate
    ```
4.  Install the project dependencies using `uv` (this will use `pyproject.toml`):
    ```bash
    uv sync
    ```

**Running the Server:**

1.  Ensure your `uv` virtual environment is activated.
2.  Start the LangGraph server in development mode:
    ```bash
    langgraph dev --no-browser
    ```
    This command starts the server, typically without opening a browser window. Check the terminal output for the server address (usually `http://localhost:2024`).

### 2. AIOS Desktop App (Frontend)

The frontend is an Electron application that provides the user interface for interacting with AIOS.

**Setup:**

1.  Navigate to the frontend directory:
    ```bash
    cd aios-desktop-app
    ```
2.  Create your environment configuration file:
    Copy `.env.example` to a new file named `.env`.
    ```bash
    cp .env.example .env
    ```
    Then, open `.env` and fill in any necessary environment-specific variables for the desktop application.
3.  Install Node.js dependencies:
    ```bash
    npm install
    ```
    The `postinstall` script will automatically run `electron-builder install-app-deps` to ensure all Electron-specific native dependencies are correctly set up.

**Running the App (Development Mode):**

1.  Start the development server:
    ```bash
    npm run dev
    ```
    This will launch the Electron application with hot-reloading enabled, allowing you to see changes live as you develop.

## Development Workflow

1.  Start the `aios-langgraph-server` first.
2.  Then, start the `aios-desktop-app`.
3.  The desktop app should connect to the locally running backend server.

## Building for Production

**aios-desktop-app:**

Refer to the scripts in `aios-desktop-app/package.json` for building the Electron app for different platforms (Windows, macOS, Linux):
```bash
cd aios-desktop-app
npm run build:win
npm run build:mac
npm run build:linux
```

**aios-langgraph-server:**

The LangGraph server is typically deployed as a Python web application. Deployment strategies can vary (e.g., Docker, serverless functions, traditional ASGI server hosting). The `langgraph export` command can be used to package the LangGraph application. Further details on deployment would depend on the chosen hosting environment.

---

This README provides the basic steps to get started. For more detailed information on specific components, refer to the documentation within each project's directory (if available) or consult their respective `package.json` and `pyproject.toml` files.
