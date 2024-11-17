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
    role: 'USER' | 'ADMIN';
    createdAt: Date;
    updatedAt: Date;
  }
  