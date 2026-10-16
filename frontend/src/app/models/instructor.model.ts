// Same rule as the server: digits plus common separators, 7 to 20 characters
export const PHONE_PATTERN = /^[0-9()+\-.\s]{7,20}$/;

/** An instructor as the API returns it. */
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
