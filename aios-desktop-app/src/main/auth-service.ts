import { app, ipcMain, shell } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
// import { AuthState, TokenData } from '@shared/types/auth-types';
import { AuthState } from "../shared/types/auth-types.js";
import { getMainWindow } from "./windowManager.js";

export class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    error: null,
  };
  private authFile: string;
  private token: string | null = null;

  constructor() {
    this.authFile = path.join(app.getPath("userData"), ".auth.json");
    this.loadStoredAuth();
  }

  private async loadStoredAuth() {
    try {
      const data = await fs.readFile(this.authFile, "utf-8");
      const stored = JSON.parse(data);
      if (stored.token && stored.user) {
        this.token = stored.token;
        this.authState = {
          isAuthenticated: true,
          user: stored.user,
          error: null,
        };
      }
    } catch (error) {
      console.log("No stored auth found");
    }
  }

  private async saveAuth() {
    try {
      await fs.writeFile(
        this.authFile,
        JSON.stringify({
          token: this.token,
          user: this.authState.user,
        })
      );
    } catch (error) {
      console.error("Failed to save auth:", error);
    }
  }

  async handleAuthCallback(url: string): Promise<boolean> {
    try {
      console.log("[Auth] Received callback URL:", url);
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get("token");
      const userId = urlObj.searchParams.get("user_id");
      const email = urlObj.searchParams.get("email");

      console.log("[Auth] Parsed parameters:", {
        hasToken: !!token,
        userId,
        email,
      });

      if (token && userId && email) {
        this.token = token;
        this.authState = {
          isAuthenticated: true,
          user: {
            id: userId,
            email: email,
          },
          error: null,
        };
        await this.saveAuth();

        // Get the main window and notify it of the auth state change
        const mainWindow = getMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send("auth-state-changed", this.authState);
        }

        return true;
      }

      console.log("[Auth] Missing required parameters in callback");
      this.authState = {
        isAuthenticated: false,
        user: null,
        error: "Authentication failed: Missing required parameters",
      };
      return false;
    } catch (error) {
      console.error("[Auth] Callback error:", error);
      this.authState = {
        isAuthenticated: false,
        user: null,
        error:
          "Authentication failed: " +
          (error instanceof Error ? error.message : String(error)),
      };
      return false;
    }
  }

  getAuthState(): AuthState {
    return this.authState;
  }

  async logout() {
    this.token = null;
    this.authState = {
      isAuthenticated: false,
      user: null,
      error: null,
    };
    try {
      await fs.unlink(this.authFile);
    } catch (error) {
      console.log("No auth file to remove");
    }
  }
}

export function setupAuthHandlers(authService: AuthService) {
  // Handle deep linking
  if (!app.isDefaultProtocolClient("aios")) {
    app.setAsDefaultProtocolClient("aios");
  }

  // Open login/signup in browser
  ipcMain.handle(
    "auth:openExternal",
    (_event, type: "signin" | "signup", provider?: string) => {
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const redirectUrl = "aios://auth/callback";
      const state = Buffer.from(
        JSON.stringify({
          isElectron: true,
          redirectUri: redirectUrl,
        })
      ).toString("base64");

      let url: URL;

      if (provider === "google") {
        // Use the Google auth endpoint
        url = new URL(`${baseUrl}/auth/google`);
      } else {
        // Use the regular signin/signup endpoint
        url = new URL(`${baseUrl}/${type}`);
      }

      url.searchParams.set("redirect_uri", redirectUrl);
      url.searchParams.set("state", state);
      url.searchParams.set("is_electron", "true");

      console.log("[Auth] Opening external URL:", url.toString());
      shell.openExternal(url.toString());
    }
  );

  // Get auth state
  ipcMain.handle("auth:getState", () => {
    return authService.getAuthState();
  });

  // Logout
  ipcMain.handle("auth:logout", async () => {
    await authService.logout();
    return authService.getAuthState();
  });
}
