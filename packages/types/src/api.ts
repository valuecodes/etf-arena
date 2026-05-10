import { z } from "zod";

export const TeamSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  persona: z.string(),
  nav: z.number(),
  rank: z.number().int().positive(),
});
export type Team = z.infer<typeof TeamSchema>;

export const TeamsResponseSchema = z.array(TeamSchema);
export type TeamsResponse = z.infer<typeof TeamsResponseSchema>;

export const TeamDetailSchema = TeamSchema.extend({
  model: z.string(),
  startingCash: z.number(),
  startedAt: z.string(),
});
export type TeamDetail = z.infer<typeof TeamDetailSchema>;
