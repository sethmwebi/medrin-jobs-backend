// src/types/index.d.ts

export interface Blog {
    id: string;
    title: string;
    post: string;
    image?: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface User {
		id: string;
		email: string;
		name: string;
		password: string;
		role: "USER" | "ADMIN";
		createdAt: Date;
		updatedAt: Date;
		email: string;
		emailVerified: Date | null;
		image: string | null;
		password: string;
		role: UserRole;
		companyName?: string; // Add these fields
		companySize?: string;
		companyLocation?: string;
		companyWebsite?: string;
		industry?: string;
		phoneNumber?: string;
		jobPostQuota: number;
		createdAt: Date;
		updatedAt: Date;
  }
  