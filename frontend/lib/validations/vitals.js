import { z } from "zod";

export const vitalsSchema = z.object({
  bloodPressure: z.string()
    .regex(/^\d{2,3}\/\d{2,3}$/, "Format must be SYS/DIA e.g. 120/80"),
});
