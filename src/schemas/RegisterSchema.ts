import { z } from "zod";

export const RegisterSchema = z
  .object({
    email: z.string().email({ message: "Invalid message address" }),
    name: z.string().optional(),
    role: z.enum(["JOBSEEKER", "EMPLOYER", "ADMIN", "SUPERADMIN"]),
    provider: z.enum(["google", "credentials"]).default("credentials"),
    password: z
      .string()
      .min(6, { message: "Password should be atleast 6 characters long" }),
    confirmPassword: z.string(),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "The passwords did not match",
        path: ["confirmPassword"],
      });
    }
  });
