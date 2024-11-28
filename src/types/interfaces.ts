/** @format */

export interface Job {
	id: string;
	title: string;
	description: string;
	category: string;
	employmentType: string;
	location: string;
	company: string;
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
  avatar: string;
  registeredAt: Date;
  country: string;
}
export interface AuthenticatedRequest extends Request {
	user: { id: string };
}