type Challenge = {
  id: string;
  userId: string;
  name: string;
  targetNumber: number;
  color: string;
  icon: string;
  timeframeUnit: "year" | "month" | "custom";
  startDate?: string;
  endDate?: string;
  year: number;
  isPublic: boolean;
  archived: boolean;
  createdAt: string;
};

type Entry = {
  id: string;
  userId: string;
  challengeId: string;
  date: string;
  count: number;
  note?: string;
  sets?: { reps: number }[];
  feeling?: "very-easy" | "easy" | "moderate" | "hard" | "very-hard";
  createdAt: string;
};

type Followed = {
  id: string;
  userId: string;
  challengeId: string;
  followedAt: string;
};

type User = {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
};

const store = {
  challenges: [] as Challenge[],
  entries: [] as Entry[],
  followed: [] as Followed[],
  users: new Map<string, User>(),
};

function nextId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function listChallenges(userId: string, active?: boolean) {
  return store.challenges.filter((challenge) => {
    if (challenge.userId !== userId) return false;
    if (active === undefined) return true;
    if (active) {
      if (challenge.archived) return false;
      if (challenge.endDate) {
        return challenge.endDate >= today();
      }
      return challenge.year >= new Date().getFullYear();
    }
    return challenge.archived;
  });
}

export function createChallenge(
  userId: string,
  payload: Omit<Challenge, "id" | "userId" | "createdAt">
) {
  const challenge: Challenge = {
    ...payload,
    id: nextId("challenge"),
    userId,
    createdAt: new Date().toISOString(),
  };
  store.challenges.push(challenge);
  return challenge;
}

export function updateChallenge(userId: string, id: string, updates: Partial<Challenge>) {
  const challenge = store.challenges.find(
    (candidate) => candidate.id === id && candidate.userId === userId
  );
  if (!challenge) return null;
  Object.assign(challenge, updates);
  return challenge;
}

export function deleteChallenge(userId: string, id: string) {
  const index = store.challenges.findIndex(
    (candidate) => candidate.id === id && candidate.userId === userId
  );
  if (index === -1) return null;
  const [removed] = store.challenges.splice(index, 1);
  store.entries = store.entries.filter((entry) => entry.challengeId !== id);
  store.followed = store.followed.filter((record) => record.challengeId !== id);
  return removed;
}

export function listEntries(userId: string, filters: { challengeId?: string; date?: string }) {
  return store.entries.filter((entry) => {
    if (entry.userId !== userId) return false;
    if (filters.challengeId && entry.challengeId !== filters.challengeId) return false;
    if (filters.date && entry.date !== filters.date) return false;
    return true;
  });
}

export function createEntry(
  userId: string,
  payload: Omit<Entry, "id" | "userId" | "createdAt">
) {
  const entry: Entry = {
    ...payload,
    id: nextId("entry"),
    userId,
    createdAt: new Date().toISOString(),
  };
  store.entries.push(entry);
  return entry;
}

export function updateEntry(userId: string, id: string, updates: Partial<Entry>) {
  const entry = store.entries.find(
    (candidate) => candidate.id === id && candidate.userId === userId
  );
  if (!entry) return null;
  Object.assign(entry, updates);
  return entry;
}

export function deleteEntry(userId: string, id: string) {
  const index = store.entries.findIndex(
    (candidate) => candidate.id === id && candidate.userId === userId
  );
  if (index === -1) return null;
  return store.entries.splice(index, 1)[0];
}

export function listFollowed(userId: string) {
  return store.followed.filter((record) => record.userId === userId);
}

export function createFollowed(userId: string, challengeId: string) {
  const record: Followed = {
    id: nextId("followed"),
    userId,
    challengeId,
    followedAt: new Date().toISOString(),
  };
  store.followed.push(record);
  return record;
}

export function deleteFollowed(userId: string, id: string) {
  const index = store.followed.findIndex(
    (candidate) => candidate.id === id && candidate.userId === userId
  );
  if (index === -1) return null;
  return store.followed.splice(index, 1)[0];
}

export function listPublicChallenges() {
  return store.challenges.filter((challenge) => challenge.isPublic && !challenge.archived);
}

export function getExportData(userId: string) {
  return {
    challenges: store.challenges.filter((challenge) => challenge.userId === userId),
    entries: store.entries.filter((entry) => entry.userId === userId),
    followed: store.followed.filter((record) => record.userId === userId),
  };
}

export function clearAllData(userId: string) {
  store.challenges = store.challenges.filter((challenge) => challenge.userId !== userId);
  store.entries = store.entries.filter((entry) => entry.userId !== userId);
  store.followed = store.followed.filter((record) => record.userId !== userId);
}

export function replaceAllData(
  userId: string,
  payload: {
    challenges: Challenge[];
    entries: Entry[];
    followed: Followed[];
  }
) {
  clearAllData(userId);
  const challengeIdMap = new Map<string, string>();
  const challenges = payload.challenges.map((challenge) => {
    const id = nextId("challenge");
    challengeIdMap.set(challenge.id, id);
    return {
      ...challenge,
      id,
      userId,
      createdAt: challenge.createdAt || new Date().toISOString(),
    };
  });
  store.challenges.push(...challenges);

  const entries = payload.entries.map((entry) => ({
    ...entry,
    id: nextId("entry"),
    userId,
    challengeId: challengeIdMap.get(entry.challengeId) ?? entry.challengeId,
    createdAt: entry.createdAt || new Date().toISOString(),
  }));
  store.entries.push(...entries);

  const followed = payload.followed.map((record) => ({
    ...record,
    id: nextId("followed"),
    userId,
    challengeId: challengeIdMap.get(record.challengeId) ?? record.challengeId,
    followedAt: record.followedAt || new Date().toISOString(),
  }));
  store.followed.push(...followed);

  return { challenges, entries, followed };
}

export function registerUser(userId: string, profile: User) {
  store.users.set(userId, profile);
}

export function getUser(userId: string) {
  return store.users.get(userId);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
