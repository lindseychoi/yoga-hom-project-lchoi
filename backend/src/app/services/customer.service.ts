import { Customer, ICustomer } from '../models/customer.model';
import { Counter } from '../models/counter.model';
import { Sale } from '../models/sale.model';
import { Attendance } from '../models/attendance.model';
import { INotification } from '../models/notification.model';
import * as notificationService from './notification.service';
import { AppError } from '../../middleware/error-handler';

/** Lists customers, newest first. */
export const findAll = async (): Promise<ICustomer[]> => {
  return Customer.find().sort({ createdAt: -1 });
};

/** Returns one customer by database ID, or a 404. */
export const findById = async (id: string): Promise<ICustomer> => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new AppError(404, 'Customer not found');
  }
  return customer;
};

/**
 * Creates a customer and sends the UC4 welcome message. The balance always starts at 0, whatever the form sends;
 * it only changes through sales and attendance. Validation runs first so a bad form doesn't use up an ID.
 */
export const create = async ({
  classBalance,
  ...data
}: Partial<ICustomer>): Promise<{ customer: ICustomer; notification: INotification }> => {
  const customer = new Customer(data);
  await customer.validate({ pathsToSkip: ['customerId'] });

  const counter = await Counter.findByIdAndUpdate(
    { _id: 'customer' },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  customer.customerId = `C${String(counter.sequenceValue).padStart(5, '0')}`;

  const saved = await customer.save();
  const notification = await notificationService.send(
    saved.customerId,
    saved,
    `Welcome to Yoga'Hom! Your customer id is ${saved.customerId}.`
  );
  return { customer: saved, notification };
};

/** Applies the changes and re-checks them against the schema. The balance can't be edited here. */
export const update = async (
  id: string,
  { classBalance, ...data }: Partial<ICustomer>
): Promise<ICustomer> => {
  const customer = await Customer.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!customer) {
    throw new AppError(404, 'Customer not found');
  }
  return customer;
};

/** Deletes a customer, or a 404 if it doesn't exist. */
export const remove = async (id: string): Promise<void> => {
  // Keep sales history intact: a customer who has bought a package can't be deleted
  const customer = await findById(id);
  if (await Sale.exists({ customerId: customer.customerId })) {
    throw new AppError(409, "This customer has sales and can't be deleted");
  }
  // Same for attendance: past class sheets keep their customers
  if (await Attendance.exists({ 'entries.customerId': customer.customerId })) {
    throw new AppError(409, "This customer has attendance records and can't be deleted");
  }
  await customer.deleteOne();
};

/** True if a customer with this first and last name exists, ignoring capitals. The screen uses it to warn before saving a duplicate. */
export const checkDuplicate = async (
  firstName: string,
  lastName: string
): Promise<boolean> => {
  const existing = await Customer.findOne({
    firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
    lastName: { $regex: new RegExp(`^${lastName}$`, 'i') },
  });
  return !!existing;
};
