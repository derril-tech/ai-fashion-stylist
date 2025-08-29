import { monitorImageProcessing } from './observability';
import { generateId } from './utils';

export interface Capsule {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  shareCode?: string;
  watermark?: string;
  items: CapsuleItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CapsuleItem {
  itemId: string;
  order: number;
}

export interface ShareLink {
  id: string;
  capsuleId: string;
  shareUrl: string;
  views: number;
  expiresAt?: Date;
}

export function generateShareCode(): string {
  return generateId().slice(0, 8).toUpperCase();
}

export function generateShareUrl(shareCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/share/${shareCode}`;
}

export function generateWatermark(creatorName: string, capsuleName: string): string {
  return `Created by ${creatorName} • ${capsuleName} • AI Fashion Stylist`;
}

export async function createCapsule(data: {
  userId: string;
  name: string;
  description?: string;
  isPublic?: boolean;
  itemIds: string[];
}): Promise<Capsule> {
  const span = monitorImageProcessing('createCapsule', { itemCount: data.itemIds.length });
  
  const capsule: Capsule = {
    id: generateId(),
    userId: data.userId,
    name: data.name,
    description: data.description,
    isPublic: data.isPublic || false,
    shareCode: data.isPublic ? generateShareCode() : undefined,
    items: data.itemIds.map((itemId, index) => ({
      itemId,
      order: index
    })),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  span.end();
  return capsule;
}

export async function createShareLink(
  capsuleId: string,
  userId: string,
  expiresInDays?: number
): Promise<ShareLink> {
  const span = monitorImageProcessing('createShareLink', { capsuleId });
  
  const shareCode = generateShareCode();
  const shareUrl = generateShareUrl(shareCode);
  
  const shareLink: ShareLink = {
    id: generateId(),
    capsuleId,
    shareUrl,
    views: 0,
    expiresAt: expiresInDays ? 
      new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : 
      undefined
  };

  span.end();
  return shareLink;
}

export function validateCapsuleAccess(
  capsule: Capsule,
  userId?: string
): { canView: boolean; canEdit: boolean } {
  if (!capsule.isPublic && capsule.userId !== userId) {
    return { canView: false, canEdit: false };
  }
  
  return {
    canView: true,
    canEdit: capsule.userId === userId
  };
}

export function getCapsuleStats(capsule: Capsule) {
  return {
    itemCount: capsule.items.length,
    isPublic: capsule.isPublic,
    hasShareCode: !!capsule.shareCode,
    createdDaysAgo: Math.floor((Date.now() - capsule.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  };
}

export const CAPSULE_TEMPLATES = {
  WORK_WEEK: {
    name: 'Work Week Essentials',
    description: 'Professional pieces for a full work week',
    categories: ['tops', 'bottoms', 'outerwear', 'shoes'],
    minItems: 10
  },
  TRAVEL: {
    name: 'Travel Capsule',
    description: 'Versatile pieces for any destination',
    categories: ['tops', 'bottoms', 'dresses', 'outerwear'],
    minItems: 8
  },
  WEEKEND: {
    name: 'Weekend Casual',
    description: 'Comfortable pieces for leisure time',
    categories: ['tops', 'bottoms', 'dresses', 'shoes'],
    minItems: 6
  },
  SEASONAL: {
    name: 'Seasonal Collection',
    description: 'Weather-appropriate seasonal pieces',
    categories: ['tops', 'bottoms', 'outerwear', 'accessories'],
    minItems: 12
  }
};
