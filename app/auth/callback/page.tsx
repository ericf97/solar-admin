"use client"
import { useEffect } from "react"
import { useRouter, } from "next/navigation";
import { useApiStore } from "../../../store/apiStore";
import { authService } from "@/services/authService";

const FIREBASE_API_KEY = 'AIzaSyD_S-ITsmf2PfxuSVnrPuw225pY8vvYuZc';
const REDIRECT_URI = "http://localhost:8080/auth/callback";

export default function AuthCallback() {
  const router = useRouter()

  async function getTokenFirebase(accessToken: string) {
    if (!accessToken)
      return;
    const firebaseUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`;
    const payload = {
      postBody: `access_token=${accessToken}&providerId=google.com`,
      requestUri: REDIRECT_URI,
      returnIdpCredential: true,
      returnSecureToken: true,
    };
    try {
      const response = await fetch(firebaseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) return res.status(500).json({ error: data.error });
      return data;
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    const processLogin = async () => {
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)

      const tokenGoogle = params.get("access_token");
      if (!tokenGoogle) {
        console.warn("No access_token from Google");
        router.push("/login?error=missing_token");
        return;
      }

      try {

        const { idToken: accessToken } = await getTokenFirebase(tokenGoogle);

        if (!accessToken) {
          console.warn("getTokenFirebase did not return idToken");
          router.push("/login?error=unauthorized");
          return;
        }

        const store = useApiStore.getState();
        store.setBearerToken(accessToken);

        const userLogin = await authService.loginAdmin();
        store.setEmail(userLogin.email);

        const expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString()
        document.cookie = `access_token=${accessToken}; path=/; expires=${expires}; samesite=strict`

        // 4. Redirigir al home
        router.push("/")
      } catch (err) {
        console.error("Login error:", err)
        router.push('/unauthorized')
      }
    }
    processLogin()


  }, [router])

  return <p>processing login...</p>
}
