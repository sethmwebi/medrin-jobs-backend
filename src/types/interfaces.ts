/** @format */

import exp from "constants";

export interface Job {
	id: string;
	title: string;
	description: string;
	category: string;
	employmentType: string;
	location: string;
	companyName: string;
	requirements: string[];
	salaryRange: {
		min: number;
		max: number;
	};
	applicationDeadline: Date,
	applicationInstructions: string,
	requiredDocuments: []
	status: string;
	
}

export interface User {
	userId: string;
	fullName: string;
	email: string;
	id: string;
	name: string | null;

	emailVerified: Date | null;
	image: string | null;
	password: string;
	
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
export interface AuthenticatedRequest extends Request {
	user: { id: string };
}

export interface JobApplication {
	jobSeeker_id: string;
	jobSeeker_firstname: string;
	jobSeeker_lastname: string;
	jobSeeker_email: string;
	jobSeeker_phone: string;
	jobSeeker_country: string;
	job_id: string;
	employer_id: string;
	applicationStatus: string;
}