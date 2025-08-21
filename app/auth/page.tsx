"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI;
const SCOPE = process.env.NEXT_PUBLIC_SCOPE;

export default function LoginPage() {

  console.log(REDIRECT_URI)
  const handleLogin = () => {
    const oauthUrl =
      "https://accounts.google.com/o/oauth2/v2/auth" +
      "?response_type=token" +
      "&client_id=" +
      encodeURIComponent(CLIENT_ID!) +
      "&redirect_uri=" +
      encodeURIComponent(REDIRECT_URI!) +
      "&scope=" +
      encodeURIComponent(SCOPE!);
  
    window.location.href = oauthUrl
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <main className="flex flex-1 items-center justify-center p-4 md:p-6">
            <Card>
              <CardHeader>
                <CardTitle>SolAr Login</CardTitle>
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
