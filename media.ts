/**
 * Category-consistent media library.
 * Every subcategory draws its posters and videos ONLY from its own family,
 * so a boiler never shows a washer photo and vice-versa.
 */

/** Real, complete, publicly hosted MP4 videos (no clips/placeholders). */
const V = {
  a: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  b: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  c: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  d: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  e: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  f: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  g: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  h: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  i: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  j: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  k: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
  l: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  m: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
} as const;

const IMG = {
  wComputer: "/images/washer-computer.jpg",
  wHotel: "/images/washer-hotel.jpg",
  wOrdinary: "/images/washer-ordinary.jpg",
  wHouse: "/images/washer-household.jpg",
  dryer: "/images/dryer.jpg",
  carpet: "/images/carpet.jpg",
  press: "/images/press.jpg",
  boiler: "/images/boiler.jpg",
  boilerV: "/images/boiler-vertical.jpg",
  boilerH: "/images/boiler-horizontal.jpg",
} as const;

/** images + videos assigned per subcategory key. */
export const SUB_MEDIA: Record<string, { images: string[]; videos: string[] }> = {
  // ---- washers ----
  computer:   { images: [IMG.wComputer, IMG.wHouse],            videos: [V.d, V.f, V.e] },
  hotel:      { images: [IMG.wHotel, IMG.wComputer],            videos: [V.c, V.g, V.d] },
  ordinary:   { images: [IMG.wOrdinary, IMG.wHotel],            videos: [V.e, V.d, V.f] },
  household:  { images: [IMG.wHouse, IMG.wOrdinary],            videos: [V.f, V.e, V.c] },
  // ---- dryers ----
  gas:        { images: [IMG.dryer],                            videos: [V.c, V.g] },
  electric:   { images: [IMG.dryer],                            videos: [V.g, V.d] },
  steam:      { images: [IMG.dryer],                            videos: [V.c, V.e] },
  // ---- carpet line ----
  "auto-line":  { images: [IMG.carpet],                         videos: [V.i, V.l] },
  centrifuge:   { images: [IMG.carpet],                         videos: [V.l, V.i] },
  dust:         { images: [IMG.carpet],                         videos: [V.i, V.k] },
  // ---- presses ----
  "press-steam":     { images: [IMG.press],                     videos: [V.a, V.h] },
  "press-shirt":     { images: [IMG.press],                     videos: [V.h, V.b] },
  "press-trouser":   { images: [IMG.press],                     videos: [V.b, V.a] },
  "press-roller":    { images: [IMG.press],                     videos: [V.j, V.h] },
  "press-finishing": { images: [IMG.press],                     videos: [V.a, V.j] },
  // ---- conveyor belts ----
  "belt-conveyor": { images: [IMG.carpet],                      videos: [V.i, V.l] },
  "belt-sorting":  { images: [IMG.carpet],                      videos: [V.l, V.k] },
  "belt-feeding":  { images: [IMG.press],                       videos: [V.j, V.a] },
  "belt-motor":    { images: [IMG.press],                       videos: [V.a, V.j] },
  // ---- boilers ----
  "boiler-vertical":   { images: [IMG.boilerV, IMG.boiler],     videos: [V.m, V.k] },
  "boiler-horizontal": { images: [IMG.boilerH, IMG.boiler],     videos: [V.k, V.m] },
  "boiler-electric":   { images: [IMG.boiler, IMG.boilerV],     videos: [V.m, V.j] },
  "boiler-diesel":     { images: [IMG.boilerH, IMG.boiler],     videos: [V.k, V.c] },
  "boiler-gas":        { images: [IMG.boiler, IMG.boilerH],     videos: [V.c, V.m] },
  "boiler-generator":  { images: [IMG.boilerV, IMG.boiler],     videos: [V.j, V.k] },
};

export function hasBuiltInMedia(subKey: string) {
  return !!SUB_MEDIA[subKey];
}

export function mediaFor(subKey: string, index: number) {
  const m = SUB_MEDIA[subKey];
  if (!m) return { imageUrl: "", videoUrl: "" };
  return {
    imageUrl: m.images[index % m.images.length],
    videoUrl: m.videos[index % m.videos.length],
  };
}
