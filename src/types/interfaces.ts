/** @format */

export interface Job {
	id:string;
	title: string;
	description: string;
	category: string;
	workPlace_type: string;
	location: string;
	salary: number;
	company: string;
	email: string;
  contact: number;
  workTime: string;
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