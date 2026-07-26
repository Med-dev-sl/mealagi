"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending email
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            AI <span className="text-primary/70">MEAL</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sent ? "Check your email for a reset link" : "Enter your email and we'll send you a reset link"}
          </p>
        </div>
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              If an account with that email exists, we&apos;ve sent a password reset link.
            </p>
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/login">Back to login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" loading={loading}>
              Send reset link
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="font-medium text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
