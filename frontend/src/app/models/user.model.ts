export type Role = 'Manager' | 'Instructor';

// Must match MIN_PASSWORD_LENGTH on the server
export const MIN_PASSWORD_LENGTH = 8;

/** The logged-in user, and what the API sends back after a successful login. */
export interface User {
  id: string;
  email: string;
  role: Role;
  instructorId?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
