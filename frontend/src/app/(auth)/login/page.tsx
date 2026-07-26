"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      // error is handled by the auth store
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            AI <span className="text-primary/70">MEAL</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your account to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Input
            label="Email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex items-center justify-end">
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-foreground hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
