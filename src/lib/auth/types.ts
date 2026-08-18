// Authentication types for NEXUS platform

export enum UserRole {
  FOUNDER = "founder",
  INVESTOR = "investor",
  RESEARCHER = "researcher",
  ADMIN = "admin",
}

export enum UserPlan {
  EXPLORER = "explorer",
  PRO = "pro",
  TEAM = "team",
  ENTERPRISE = "enterprise",
}

export interface NexusUser {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  role: UserRole;
  plan: UserPlan;
  organization?: string | null;
}

export interface NexusSession {
  user: NexusUser;
  expires: string;
}

// Plan limits configuration
export const PLAN_LIMITS = {
  [UserPlan.EXPLORER]: {
    searchesPerDay: 10,
    sectorsTracked: 2,
    autoFillAppsPerMonth: 0,
    apiAccess: false,
    exportReports: false,
    prioritySupport: false,
  },
  [UserPlan.PRO]: {
    searchesPerDay: -1, // unlimited
    sectorsTracked: 10,
    autoFillAppsPerMonth: 5,
    apiAccess: false,
    exportReports: true,
    prioritySupport: true,
  },
  [UserPlan.TEAM]: {
    searchesPerDay: -1,
    sectorsTracked: 25,
    autoFillAppsPerMonth: 25,
    apiAccess: true,
    exportReports: true,
    prioritySupport: true,
  },
  [UserPlan.ENTERPRISE]: {
    searchesPerDay: -1,
    sectorsTracked: -1,
    autoFillAppsPerMonth: -1,
    apiAccess: true,
    exportReports: true,
    prioritySupport: true,
  },
} as const;

export type PlanLimits = typeof PLAN_LIMITS[UserPlan];
