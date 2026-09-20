import { Class, IClass } from '../models/class.model';
import { Instructor } from '../models/instructor.model';
import { AppError } from '../../middleware/error-handler';

const assertInstructorExists = async (instructorId: string): Promise<void> => {
  if (!(await Instructor.exists({ instructorId }))) {
    throw new AppError(404, 'Instructor not found');
  }
};

const assertSlotFree = async (
  dayOfWeek: IClass['dayOfWeek'],
  time: string,
  excludeId?: string
): Promise<void> => {
  const conflict = await Class.exists({
    dayOfWeek,
    time,
    ...(excludeId && { _id: { $ne: excludeId } }),
  });
  if (conflict) {
    throw new AppError(409, `A class is already scheduled on ${dayOfWeek} at ${time}`);
  }
};

export const findAll = async (instructorId?: string): Promise<IClass[]> => {
  return Class.find(instructorId ? { instructorId } : {}).sort({ createdAt: -1 });
};

export const findById = async (id: string): Promise<IClass> => {
  const found = await Class.findById(id);
  if (!found) {
    throw new AppError(404, 'Class not found');
  }
  return found;
};

export const create = async (data: Partial<IClass>): Promise<IClass> => {
  const newClass = new Class(data);
  await newClass.validate();
  await assertInstructorExists(newClass.instructorId);
  await assertSlotFree(newClass.dayOfWeek, newClass.time);
  return newClass.save();
};

export const update = async (id: string, data: Partial<IClass>): Promise<IClass> => {
  const existing = await findById(id);
  existing.set(data);
  await existing.validate();
  await assertInstructorExists(existing.instructorId);
  await assertSlotFree(existing.dayOfWeek, existing.time, id);
  return existing.save();
};

export const remove = async (id: string): Promise<void> => {
  const found = await Class.findByIdAndDelete(id);
  if (!found) {
    throw new AppError(404, 'Class not found');
  }
};
