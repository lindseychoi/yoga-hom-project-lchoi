import { Instructor, IInstructor } from '../models/instructor.model';
import { Counter } from '../models/counter.model';
import { AppError } from '../../middleware/error-handler';

export const findAll = async (): Promise<IInstructor[]> => {
  return Instructor.find().sort({ createdAt: -1 });
};

export const findById = async (id: string): Promise<IInstructor> => {
  const instructor = await Instructor.findById(id);
  if (!instructor) {
    throw new AppError(404, 'Instructor not found');
  }
  return instructor;
};

export const create = async (data: Partial<IInstructor>): Promise<IInstructor> => {
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'instructor' },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );

  const instructorId = `I${String(counter.sequenceValue).padStart(5, '0')}`;

  const instructor = new Instructor({
    ...data,
    instructorId,
  });

  return instructor.save();
};

export const update = async (
  id: string,
  data: Partial<IInstructor>
): Promise<IInstructor> => {
  const instructor = await Instructor.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!instructor) {
    throw new AppError(404, 'Instructor not found');
  }
  return instructor;
};

export const remove = async (id: string): Promise<void> => {
  const instructor = await Instructor.findByIdAndDelete(id);
  if (!instructor) {
    throw new AppError(404, 'Instructor not found');
  }
};

export const checkDuplicate = async (
  firstName: string,
  lastName: string
): Promise<boolean> => {
  const existing = await Instructor.findOne({
    firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
    lastName: { $regex: new RegExp(`^${lastName}$`, 'i') },
  });
  return !!existing;
};
