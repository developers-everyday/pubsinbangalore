// Social media and external links configuration
export const SOCIAL_LINKS = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/pubsinbangalore",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/",
  bookingForm: process.env.NEXT_PUBLIC_BOOKING_FORM_URL || "/contact",
} as const;

export const SITE_CONFIG = {
  name: "PubsInBangalore",
  url: "https://pubsinbangalore.com",
  description: "Discover the best pubs, bars, and nightlife in Bangalore",
  logo: "https://pubsinbangalore.com/logo.png",
} as const;

