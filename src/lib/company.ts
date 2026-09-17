/**
 * Real Tentvaale contact details, taken from tentvaale.com/pages/contact-us.
 *
 * Single source of truth: the footer, the contact page and any future CTA read
 * from here, so a change to a phone number is one edit rather than a grep.
 *
 * The placeholders this replaced were Mumbai-based (a Lower Parel studio
 * address and a +91 22 landline). The business is in Vadodara — if you find a
 * Mumbai contact detail anywhere in the codebase, it is stale, not a second
 * office.
 *
 * Deliberately free of JSX and icon imports so it can be read from anywhere;
 * the brand marks live in `components/social-icons.tsx`.
 */

/** tel:/wa.me links need E.164 with no punctuation; the display form keeps it. */
export interface PhoneNumber {
  display: string;
  e164: string;
}

export const COMPANY = {
  name: "Tentvaale",

  phones: [
    { display: "+91 87809 83664", e164: "918780983664" },
    { display: "+91 96018 29992", e164: "919601829992" },
  ] as PhoneNumber[],

  /** The second number doubles as the WhatsApp line. */
  whatsapp: { display: "+91 96018 29992", e164: "919601829992" } as PhoneNumber,

  /**
   * TODO: both addresses on tentvaale.com sit behind Cloudflare email
   * protection, so they are not in the served HTML and could not be read.
   * Ask the client and fill this in — do not guess. Every consumer hides its
   * email row while this is null, so nothing renders a wrong address.
   */
  email: null as string | null,

  address: {
    lines: ["Nizampura", "Vadodara, Gujarat", "India 390 024"],
    /** One-line form for compact places like the footer. */
    inline: "Nizampura, Vadodara, Gujarat, India 390 024",
  },
};

export type SocialId = "instagram" | "facebook" | "youtube" | "x";

export interface SocialLink {
  id: SocialId;
  label: string;
  href: string;
}

/** Four active profiles, confirmed live on the marketing site. */
export const SOCIAL_LINKS: SocialLink[] = [
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/tentvaale/" },
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/tentvaale" },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@Tentvaale" },
  { id: "x", label: "X", href: "https://x.com/tentvaale" },
];

export function telHref(phone: PhoneNumber): string {
  return `tel:+${phone.e164}`;
}

export function whatsappHref(phone: PhoneNumber = COMPANY.whatsapp): string {
  return `https://wa.me/${phone.e164}`;
}
