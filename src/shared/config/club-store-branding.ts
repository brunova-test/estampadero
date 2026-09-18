export interface ClubStoreBranding {
  bannerUrl?: string;
  logoUrl?: string;
}

const CLUB_STORE_BRANDING: Record<string, ClubStoreBranding> = {
  "club-atletico": {
    bannerUrl: "/images/hero-2.png",
  },
  "escuela-n14": {
    bannerUrl: "/images/club-stores/escuela-n14-banner.png",
    logoUrl: "/images/club-stores/escuela-n14-logo.png",
  },
  "voley-norte": {
    bannerUrl: "/images/hero-3.png",
  },
  "rugby-sur": {
    bannerUrl: "/images/hero-1.png",
  },
};

export function getClubStoreBranding(slug: string): ClubStoreBranding {
  return CLUB_STORE_BRANDING[slug] ?? {};
}
