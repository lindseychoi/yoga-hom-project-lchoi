import { Sale, ISale } from '../models/sale.model';
import { Customer, ICustomer } from '../models/customer.model';
import { Package, UNLIMITED } from '../models/package.model';
import { AppError } from '../../middleware/error-handler';

/** How far the payment time can be from now and still count as "current" (UC5). */
const PAYMENT_TOLERANCE_MS = 24 * 60 * 60 * 1000;

/** Lists sales, newest first. */
export const findAll = async (): Promise<ISale[]> => {
  return Sale.find().sort({ paymentDate: -1 });
};

/** Records a sale after the UC5 checks, then adds the package's classes to the customer's balance. */
export const create = async (
  data: Partial<ISale>
): Promise<{ sale: ISale; customer: ICustomer }> => {
  // Required fields and allowed values first
  const sale = new Sale(data);
  await sale.validate();

  const [customer, pkg] = await Promise.all([
    Customer.findOne({ customerId: sale.customerId }),
    Package.findOne({ packageId: sale.packageId }),
  ]);
  if (!customer || !pkg) {
    throw new AppError(404, 'Customer or package not found');
  }

  // Amount paid has to be the package price
  if (sale.amountPaid !== pkg.price) {
    throw new AppError(400, `Amount paid must be ${pkg.price}, the price of ${pkg.packageName}`);
  }

  // Payment date and time have to be current
  if (Math.abs(sale.paymentDate.getTime() - Date.now()) > PAYMENT_TOLERANCE_MS) {
    throw new AppError(400, 'Payment date must be within a day of now');
  }

  // Validity has to fall inside the package's dates, end after it starts, and not already be over
  if (sale.validityStart < pkg.startDate || sale.validityEnd > pkg.endDate) {
    throw new AppError(400, 'Validity dates must be within the package dates');
  }
  if (sale.validityEnd <= sale.validityStart) {
    throw new AppError(400, 'Validity end must be after validity start');
  }
  if (sale.validityEnd < new Date()) {
    throw new AppError(400, 'Validity end is already in the past');
  }

  const saved = await sale.save();
  // Unlimited packages don't change the balance
  if (pkg.numberOfClasses !== UNLIMITED) {
    customer.classBalance += pkg.numberOfClasses;
    await customer.save();
  }
  return { sale: saved, customer };
};
