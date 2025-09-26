"use client"; // required for client-side interactivity
import { useEffect, useState } from "react";
import { supabase } from "@lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) router.push("/dashboard");
    };
    checkUser();
  }, [router]);

  const handleLogin = async () => {
    setMessage(""); // reset message
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`, //email redirects to dashboard page
        },
      });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the magic login link!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4 text-center text-blue-600">
        Loyalty App Login
      </h1>

      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded mb-2 w-full max-w-sm text-black"
      />

      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full max-w-sm"
      >
        Send Magic Link
      </button>

      {message && <p className="mt-4 text-center text-blue-500">{message}</p>}
    </div>
  );
}
