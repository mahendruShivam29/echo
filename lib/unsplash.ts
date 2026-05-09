import { requireEnv } from "@/lib/env";

type UnsplashPhoto = {
  alt_description: string | null;
  urls: {
    regular?: string;
    small?: string;
    full?: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  links: {
    html: string;
  };
};

type UnsplashSearchResponse = {
  results?: UnsplashPhoto[];
};

export type TrackCover = {
  cover_image_url: string;
  cover_image_alt: string | null;
  cover_photographer_name: string;
  cover_photographer_url: string;
  cover_unsplash_url: string;
};

const APP_NAME = "project-echo";

function withReferral(url: string) {
  const parsed = new URL(url);
  parsed.searchParams.set("utm_source", APP_NAME);
  parsed.searchParams.set("utm_medium", "referral");
  return parsed.toString();
}

function buildSearchQuery(prompt: string) {
  return prompt
    .split(/[,.]/)[0]
    .split(/\s+/)
    .slice(0, 10)
    .join(" ")
    .trim();
}

export async function searchTrackCover(prompt: string): Promise<TrackCover | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    return null;
  }

  const query = buildSearchQuery(prompt);
  if (!query) {
    return null;
  }

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "1");
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("content_filter", "high");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Client-ID ${requireEnv("UNSPLASH_ACCESS_KEY")}`,
      "Accept-Version": "v1"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    console.error("Unsplash search failed", {
      status: response.status,
      statusText: response.statusText
    });
    return null;
  }

  const data = (await response.json()) as UnsplashSearchResponse;
  const photo = data.results?.[0];

  if (!photo) {
    return null;
  }

  const coverImageUrl = photo.urls.regular ?? photo.urls.small ?? photo.urls.full;
  if (!coverImageUrl) {
    return null;
  }

  return {
    cover_image_url: coverImageUrl,
    cover_image_alt: photo.alt_description,
    cover_photographer_name: photo.user.name,
    cover_photographer_url: withReferral(photo.user.links.html),
    cover_unsplash_url: withReferral(photo.links.html)
  };
}
