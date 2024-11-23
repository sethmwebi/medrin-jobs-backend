/** @format */

export interface Job {
	id: string;
	title: string;
	description: string;
	category: string;
	employment_type: string;
	location: string;
	company: string;
	email: string;
	contact: string;
	requirements: string[];
	salaryRange: {
		min: number;
		max: number;
	};
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