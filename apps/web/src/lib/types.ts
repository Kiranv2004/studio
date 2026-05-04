export type Role = 'super_admin' | 'studio_admin';

export interface StudioBrand {
  slug: string;
  name: string;
  brandColor: string;
  logoUrl: string;
}

export interface Me {
  id: string;
  email: string;
  role: Role;
  studioId?: string;
  studio?: StudioBrand; // present for studio_admin
}

export interface Studio {
  id: string;
  slug: string;
  name: string;
  brandColor: string;
  logoUrl: string;
  contactEmail: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  campaignCount?: number;
  leadCount?: number;
}

export interface Campaign {
  id: string;
  studioId: string;
  studioSlug?: string;
  studioName?: string;
  slug: string;
  name: string;
  description: string;
  fitnessPlans: string[];
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  leadCount?: number;
  shareUrl: string;
}

export type LeadStatus = 'new' | 'contacted' | 'trial_booked' | 'member' | 'dropped';

export const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'trial_booked',
  'member',
  'dropped',
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  trial_booked: 'Trial booked',
  member: 'Member',
  dropped: 'Dropped',
};

export interface Lead {
  id: string;
  studioId: string;
  studioName?: string;
  studioSlug?: string;
  campaignId: string;
  campaignName?: string;
  campaignSlug?: string;
  name: string;
  email: string;
  phone: string;
  fitnessPlan: string;
  goals: string;
  source: string;
  status: LeadStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
