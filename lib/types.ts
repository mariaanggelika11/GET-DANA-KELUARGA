export type ReleaseStatus = "draft" | "published" | "archived";
export interface Release {
  id: string;
  versionName: string;
  versionCode: number;
  releaseDate: string;
  fileName: string;
  fileSize: number;
  minAndroid: string;
  sha256: string;
  releaseNotes: string[];
  status: ReleaseStatus;
  downloads: number;
  downloadUrl: string;
  active: boolean;
}
export interface Screenshot {
  id: string;
  title: string;
  alt: string;
  url: string;
  sortOrder: number;
}
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  sortOrder?: number;
}
export interface SiteSettings {
  supportEmail: string;
  supportUrl: string;
  heroTitle: string;
  heroDescription: string;
  aboutText: string;
}
export interface PublicData {
  release: Release | null;
  releases: Release[];
  screenshots: Screenshot[];
  faqs: FAQ[];
  settings: SiteSettings;
}
