import { Package, IPackage } from '../models/package.model';
import { Counter } from '../models/counter.model';
import { Sale } from '../models/sale.model';
import { AppError } from '../../middleware/error-handler';

/** Lists packages, newest first. */
export const findAll = async (): Promise<IPackage[]> => {
  return Package.find().sort({ createdAt: -1 });
};

/** Returns one package by database ID, or a 404. */
export const findById = async (id: string): Promise<IPackage> => {
  const found = await Package.findById(id);
  if (!found) {
    throw new AppError(404, 'Package not found');
  }
  return found;
};

/** Creates a package. Validation runs before the counter, so a bad form doesn't use up an ID (PKG001, PKG002, ...). */
export const create = async (data: Partial<IPackage>): Promise<IPackage> => {
  const pkg = new Package(data);
  await pkg.validate({ pathsToSkip: ['packageId'] });

  const counter = await Counter.findByIdAndUpdate(
    { _id: 'package' },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  pkg.packageId = `PKG${String(counter.sequenceValue).padStart(3, '0')}`;
  return pkg.save();
};

/** Applies the changes and saves, so the start/end date check runs again. */
export const update = async (id: string, data: Partial<IPackage>): Promise<IPackage> => {
  const existing = await findById(id);
  existing.set(data);
  return existing.save();
};

/** Deletes a package, or a 404 if it doesn't exist. */
export const remove = async (id: string): Promise<void> => {
  // Keep sales history intact: a package that has been sold can't be deleted
  const pkg = await findById(id);
  if (await Sale.exists({ packageId: pkg.packageId })) {
    throw new AppError(409, "This package has sales and can't be deleted");
  }
  await pkg.deleteOne();
};
