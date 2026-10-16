import type { SiteSettings } from "@/db/queries/settings";

/** Outbound social links from settings; each is null until the setting exists ⚑. */
export type SocialLinks = {
  bale: string | null;
  /** The profile page. */
  instagram: string | null;
  /** A direct-message link (ig.me) when the handle is known, else the profile. */
  instagramDm: string | null;
};

export function socialLinks(socials: SiteSettings["socials"]): SocialLinks {
  const dm = socials.instagramHandle ? `https://ig.me/m/${encodeURIComponent(socials.instagramHandle)}` : null;
  return { bale: socials.bale, instagram: socials.instagram, instagramDm: dm ?? socials.instagram };
}
