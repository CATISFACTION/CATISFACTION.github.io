import type { CollectionEntry } from "astro:content";

export type Project = CollectionEntry<"projects">;

export function sortProjects(projects: Project[]) {
  return [...projects].sort((a, b) => {
    const yearA = a.data.year ?? 0;
    const yearB = b.data.year ?? 0;
    return yearB - yearA || a.data.title.localeCompare(b.data.title);
  });
}

export function projectUrl(project: Project) {
  return `/projects/${project.data.slug}/`;
}

export function featuredProjects(projects: Project[]) {
  return sortProjects(projects).filter((project) => project.data.featured).slice(0, 3);
}

