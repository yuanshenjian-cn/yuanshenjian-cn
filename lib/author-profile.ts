import authorProfileModule from "./author-profile-data.js";

export interface AuthorHeroProfile {
  id: string;
  heading: string;
  name: string;
  roles: string[];
  phone: string;
  email: string;
  summary: string[];
}

export interface AuthorSkillItem {
  level: "master" | "proficient" | "familiar";
  icon: string;
  title: string;
  description: string;
}

export interface AuthorSkillsProfile {
  id: string;
  heading: string;
  items: AuthorSkillItem[];
  certificates: string[];
}

export interface AuthorEducationProfile {
  id: string;
  heading: string;
  school: string;
  major: string;
  period: string;
  href?: string;
}

export interface AuthorExperienceItem {
  period: string;
  title: string;
  description?: string;
  list?: string[];
}

export interface AuthorExperienceProfile {
  id: string;
  heading: string;
  items: AuthorExperienceItem[];
}

export interface AuthorProjectAchievement {
  metric?: string;
  text: string;
}

export interface AuthorProjectHighlight {
  text: string;
}

export interface AuthorProjectTech {
  name: string;
}

export interface AuthorProjectItem {
  period: string;
  name: string;
  role: string;
  achievements: AuthorProjectAchievement[];
  description: string;
  highlights?: AuthorProjectHighlight[];
  techs?: AuthorProjectTech[];
}

export interface AuthorProjectsProfile {
  id: string;
  heading: string;
  items: AuthorProjectItem[];
}

export interface AuthorExtraTextItem {
  type: "text";
  label: string;
}

export interface AuthorExtraLinkItem {
  type: "link";
  label: string;
  href: string;
}

export type AuthorExtraItem = AuthorExtraTextItem | AuthorExtraLinkItem;

export interface AuthorExtraGroup {
  title: string;
  items: AuthorExtraItem[];
}

export interface AuthorExtrasProfile {
  id: string;
  heading: string;
  groups: AuthorExtraGroup[];
}

export interface AuthorProfile {
  hero: AuthorHeroProfile;
  skills: AuthorSkillsProfile;
  education: AuthorEducationProfile;
  experience: AuthorExperienceProfile;
  projects: AuthorProjectsProfile;
  extras: AuthorExtrasProfile;
}

const { authorProfileData } = authorProfileModule as {
  authorProfileData: AuthorProfile;
};

export const authorProfile: AuthorProfile = authorProfileData;

export function getAuthorSummary(profile: AuthorProfile = authorProfile): string {
  return profile.hero.roles.join(" | ");
}
