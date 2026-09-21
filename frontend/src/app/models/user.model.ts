export type Role = 'Manager' | 'Instructor';

/** The logged-in user, and what the API sends back after a successful login. */
export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: User;
}
