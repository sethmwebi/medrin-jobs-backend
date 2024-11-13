export interface Job {
  title: string;
  description: string;
  category: string;
  location: string;
  salary: number;
  company: string;
  email: string;
  contact: number;
}
export interface User {
	userId: string;
	fullName: string;
	email: string;
	avatar: string;
	registeredAt: Date;
	country: string;
}
