export interface ClubStoreBranding {
  bannerUrl?: string;
  logoUrl?: string;
}

const CLUB_STORE_BRANDING: Record<string, ClubStoreBranding> = {
  "escuela-n14": {
    bannerUrl: "/images/club-stores/escuela-n14-banner.png",
    logoUrl: "/images/club-stores/escuela-n14-logo.png",
  },
};

export function getClubStoreBranding(slug: string): ClubStoreBranding {
  return CLUB_STORE_BRANDING[slug] ?? {};
}
