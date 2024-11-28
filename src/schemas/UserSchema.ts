import { z } from "zod";

export const UserSchema = z.object({
	name: z.string(),
	email: z.string().email({ message: "Please enter a valid email address" }),
	image: z.string().optional(),
	password: z.string().optional(),
	emailVerified: z.coerce.date(),
	role: z.string(),
	companyName: z.string().optional(), 
	companySize: z.string().optional(), 
	companyLocation: z.string().optional(), 
	companyWebsite: z.string().optional(), 
	industry: z.string().optional(), 
	phoneNumber: z.string().optional(), 
});

// full user schema
export type UserSchemaType = z.infer<typeof UserSchema>;

// update user schema(all fields optional)
// src/schemas/UserSchema.ts
export const UpdateUserSchema = z.object({
  name: z.string().optional(),
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .optional(),
  image: z.string().optional(),
  password: z.string().optional(),
  emailVerified: z.coerce.date().optional(),
  role: z.string(),
  companyName: z.string().optional(), 
  companySize: z.string().optional(), 
  companyLocation: z.string().optional(), 
  companyWebsite: z.string().optional(), 
  industry: z.string().optional(), 
  phoneNumber: z.string().optional(), 
});

export type UpdateUserSchemaType = z.infer<typeof UpdateUserSchema>;
