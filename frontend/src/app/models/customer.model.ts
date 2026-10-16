/** A customer as the API returns it. classBalance can be negative (attended without enough classes left). */
export interface Customer {
  _id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  preferredContact: 'phone' | 'email';
  classBalance: number;
  createdAt: string;
  updatedAt: string;
}
