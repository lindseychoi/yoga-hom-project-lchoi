export interface Instructor {
  _id: string;
  instructorId: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  preferredContact: 'phone' | 'email';
  createdAt: string;
  updatedAt: string;
}
