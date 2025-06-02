import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";

export function AuthScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();

  const handleAuth = async (type: "signin" | "signup", provider?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`[Auth] Opening ${type} page with provider:`, provider);
      await window.api.openExternal(type, provider);
      console.log("[Auth] External page opened successfully");
    } catch (err) {
      console.error("[Auth] Error opening auth page:", err);
      setError("Failed to open authentication page");
    } finally {
      setIsLoading(false);
    }
  };

  // Show any auth errors from the auth state
  useEffect(() => {
    if (authState.error) {
      setError(authState.error);
    }
  }, [authState.error]);

  // Add debug logging for auth state changes
  useEffect(() => {
    console.log("[AuthScreen] Current auth state:", authState);
  }, [authState]);

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Welcome to AIOS</CardTitle>
          <CardDescription>
            Please sign in  to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <div className="mb-2 text-sm text-center text-red-500">{error}</div>
          )}
          {/* Google Sign In Button */}
          <Button
            className="w-full text-black bg-white border border-gray-300 hover:bg-gray-50"
            onClick={() => handleAuth("signin", "google")}
            disabled={isLoading}
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-4 h-4 mr-2"
            />
            {isLoading ? "Please wait..." : "Continue with Google"}
          </Button>

          {/* <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-background text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div> */}

          {/* Existing buttons */}
          {/* <Button
            className="w-full"
            onClick={() => handleAuth("signin")}
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : "Sign In with Email"}
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => handleAuth("signup")}
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : "Create Account"}
          </Button> */}
        </CardContent>
      </Card>
    </div>
  );
}
