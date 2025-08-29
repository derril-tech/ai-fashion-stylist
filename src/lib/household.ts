import { monitorImageProcessing } from './observability';
import { generateId } from './utils';

export interface Household {
  id: string;
  name: string;
  ownerId: string;
  members: HouseholdMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface HouseholdMember {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface HouseholdInvite {
  id: string;
  householdId: string;
  inviterUserId: string;
  inviteeEmail: string;
  role: 'admin' | 'member';
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
}

export interface HouseholdPermissions {
  canViewItems: boolean;
  canEditItems: boolean;
  canCreateOutfits: boolean;
  canInviteMembers: boolean;
  canManageMembers: boolean;
  canDeleteHousehold: boolean;
}

export function getHouseholdPermissions(
  userRole: string,
  isOwner: boolean
): HouseholdPermissions {
  const basePermissions = {
    canViewItems: true,
    canEditItems: false,
    canCreateOutfits: true,
    canInviteMembers: false,
    canManageMembers: false,
    canDeleteHousehold: false
  };

  if (isOwner) {
    return {
      canViewItems: true,
      canEditItems: true,
      canCreateOutfits: true,
      canInviteMembers: true,
      canManageMembers: true,
      canDeleteHousehold: true
    };
  }

  switch (userRole) {
    case 'admin':
      return {
        ...basePermissions,
        canEditItems: true,
        canInviteMembers: true,
        canManageMembers: true
      };
    case 'member':
      return basePermissions;
    default:
      return {
        canViewItems: false,
        canEditItems: false,
        canCreateOutfits: false,
        canInviteMembers: false,
        canManageMembers: false,
        canDeleteHousehold: false
      };
  }
}

export async function createHousehold(data: {
  name: string;
  ownerId: string;
}): Promise<Household> {
  const span = monitorImageProcessing('createHousehold', { ownerId: data.ownerId });
  
  const household: Household = {
    id: generateId(),
    name: data.name,
    ownerId: data.ownerId,
    members: [{
      id: generateId(),
      userId: data.ownerId,
      role: 'owner',
      joinedAt: new Date()
    }],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  span.end();
  return household;
}

export async function createHouseholdInvite(data: {
  householdId: string;
  inviterUserId: string;
  inviteeEmail: string;
  role: 'admin' | 'member';
}): Promise<HouseholdInvite> {
  const span = monitorImageProcessing('createHouseholdInvite', { householdId: data.householdId });
  
  const token = generateId();
  const invite: HouseholdInvite = {
    id: generateId(),
    householdId: data.householdId,
    inviterUserId: data.inviterUserId,
    inviteeEmail: data.inviteeEmail,
    role: data.role,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  };

  span.end();
  return invite;
}

export function validateHouseholdAccess(
  household: Household,
  userId: string
): { isMember: boolean; role?: string; permissions: HouseholdPermissions } {
  const member = household.members.find(m => m.userId === userId);
  
  if (!member) {
    return {
      isMember: false,
      permissions: getHouseholdPermissions('', false)
    };
  }

  const isOwner = household.ownerId === userId;
  const permissions = getHouseholdPermissions(member.role, isOwner);

  return {
    isMember: true,
    role: member.role,
    permissions
  };
}

export function getHouseholdStats(household: Household) {
  const membersByRole = household.members.reduce((acc, member) => {
    acc[member.role] = (acc[member.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalMembers: household.members.length,
    membersByRole,
    createdDaysAgo: Math.floor((Date.now() - household.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  };
}

export function canUserAccessItem(
  item: { userId: string; householdId?: string },
  requestingUserId: string,
  userHouseholds: Household[]
): boolean {
  // User can always access their own items
  if (item.userId === requestingUserId) {
    return true;
  }

  // Check if item belongs to a household the user is a member of
  if (item.householdId) {
    const household = userHouseholds.find(h => h.id === item.householdId);
    if (household) {
      const access = validateHouseholdAccess(household, requestingUserId);
      return access.isMember && access.permissions.canViewItems;
    }
  }

  return false;
}

export const HOUSEHOLD_LIMITS = {
  MAX_MEMBERS: 10,
  MAX_HOUSEHOLDS_PER_USER: 3,
  INVITE_EXPIRY_DAYS: 7
};
