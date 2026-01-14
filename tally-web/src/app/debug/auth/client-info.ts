"use client";

export type ClerkProbe = {
  url: string;
  userAgent?: string;
  typeofWindowClerk?: string;
  clerkLoaded?: boolean | null;
  clerkVersion?: string | null;
  resourceUrls?: string[];
  health?: { status: number; body?: unknown };
  client?: { status: number; body?: unknown };
  environment?: { status: number; body?: unknown };
};
