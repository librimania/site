import { technologyEssays } from "./technology/essays";

export const bacTopics = [
  {
    id: "technology",
    title: "Technology",
    route: "/writing/bac/technology",
    subtopics: technologyEssays,
  },
] as const;

