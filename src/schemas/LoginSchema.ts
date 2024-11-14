import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid message address" }),
  password: z.string().min(1, { message: "Password is required" }),
});
