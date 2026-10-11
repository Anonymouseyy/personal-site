import data from "@/content/site.json";
import type { Hole } from "./holes";

export type Link = { label: string; href: string };
export type Item = {
  title: string;
  meta?: string;
  description?: string;
  tags?: string[];
  link?: Link;
};
export type ModalContent = {
  title: string;
  subtitle?: string;
  paragraphs?: string[];
  items?: Item[];
  links?: Link[];
};
export type HoleContent = Hole & { modal: ModalContent };
export type SiteContent = {
  meta: { title: string; description: string };
  theme?: { accent?: string; bg?: string; ink?: string };
  profile: { name: string; tagline: string; summary: string | string[]; links: Link[] };
  game: { maxStrokes: number; intro: string };
  holes: HoleContent[];
};
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const withBase = (l: Link): Link =>
  l.href.startsWith("/") ? { ...l, href: base + l.href } : l;

const raw = data as unknown as SiteContent;
export const site: SiteContent = {
  ...raw,
  profile: { ...raw.profile, links: raw.profile.links.map(withBase) },
  holes: raw.holes.map((h) => ({
    ...h,
    modal: {
      ...h.modal,
      links: h.modal.links?.map(withBase),
      items: h.modal.items?.map((it) => ({ ...it, link: it.link && withBase(it.link) })),
    },
  })),
};
export const HOLES = site.holes;