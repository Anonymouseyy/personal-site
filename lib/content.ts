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

export const site = data as unknown as SiteContent;
export const HOLES = site.holes;
