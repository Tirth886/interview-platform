import { z } from 'zod';

/** Reserved for future super-admin portal mutations. */
export const stageIdParamsSchema = z.object({
  stageId: z.string().uuid(),
});

export type StageIdParamsInput = z.infer<typeof stageIdParamsSchema>;
