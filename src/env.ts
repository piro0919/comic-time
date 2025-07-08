import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const env = createEnv({
  client: {
    NEXT_PUBLIC_IS_SHOWN_PWA_PROMPT: z
      .string()
      .refine((s) => s === "true" || s === "false")
      .transform((s) => s === "true"),
    NEXT_PUBLIC_SITES_CSV_URL: z.string().url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_IS_SHOWN_PWA_PROMPT:
      process.env.NEXT_PUBLIC_IS_SHOWN_PWA_PROMPT,
    NEXT_PUBLIC_SITES_CSV_URL: process.env.NEXT_PUBLIC_SITES_CSV_URL,
  },
  server: {},
});

export default env;
