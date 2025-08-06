"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CLIENT_ID = "924091546615-di9rugo11f1o4mogj6aal5j67c02e0l5.apps.googleusercontent.com";
const REDIRECT_URI = "http://localhost:8080/auth/callback";
const SCOPE = "profile email openid";

export default function LoginPage() {

  const handleLogin = () => {
    const oauthUrl =
      "https://accounts.google.com/o/oauth2/v2/auth" +
      "?response_type=token" +
      "&client_id=" +
      encodeURIComponent(CLIENT_ID) +
      "&redirect_uri=" +
      encodeURIComponent(REDIRECT_URI) +
      "&scope=" +
      encodeURIComponent(SCOPE);
  
    window.location.href = oauthUrl
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <main className="flex flex-1 items-center justify-center p-4 md:p-6">
            <Card>
              <CardHeader>
                <CardTitle>Solar Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button id="loginButton" onClick={handleLogin}>
                  Login with google
                </Button>
              </CardContent>
            </Card>
      </main>
    </div>
  );
}
