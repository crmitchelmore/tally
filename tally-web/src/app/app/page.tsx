"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CreateChallengeDialog } from "@/components/tally/CreateChallengeDialog";

export default function AppPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isUserStored, setIsUserStored] = useState(false);

  const storeUser = useMutation(api.users.getOrCreate);
  const challenges = useQuery(
    api.challenges.listActive,
    isUserStored && user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      storeUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        name: user.fullName || undefined,
        avatarUrl: user.imageUrl || undefined,
      }).then(() => {
        setIsUserStored(true);
      });
    }
  }, [isLoaded, isSignedIn, user, storeUser]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Tally</h1>
          <p className="text-gray-600 mb-8">
            Sign in to start tracking your goals and making progress every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="rounded-2xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 transition-colors"
            >
              Create an account
            </Link>
            <Link
              href="/sign-in"
              className="rounded-2xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Tally</h1>
            <div className="flex items-center gap-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Challenges</h2>
            <p className="text-gray-600 mt-1">Track your progress and stay on pace.</p>
          </div>
          <CreateChallengeDialog />
        </div>

        {!isUserStored ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-gray-400">Setting up your account...</div>
          </div>
        ) : challenges === undefined ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-gray-400">Loading challenges...</div>
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <div className="mx-auto max-w-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No challenges yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first challenge to start tracking your progress.
              </p>
              <CreateChallengeDialog />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <div
                key={challenge._id}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: challenge.color + "20", color: challenge.color }}
                  >
                    {challenge.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900">{challenge.name}</h3>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-gray-500">Target</p>
                    <p className="text-2xl font-bold text-gray-900">{challenge.targetNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {challenge.timeframeUnit === "year" 
                        ? challenge.year 
                        : challenge.timeframeUnit === "month"
                        ? "Monthly"
                        : "Custom"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
