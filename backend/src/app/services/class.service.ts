import { Class, IClass } from '../models/class.model';
import { Instructor } from '../models/instructor.model';
import { AppError } from '../../middleware/error-handler';

/** Fails with 404 if no instructor has this readable ID (for example I00001). */
const assertInstructorExists = async (instructorId: string): Promise<void> => {
  if (!(await Instructor.exists({ instructorId }))) {
    throw new AppError(404, 'Instructor not found');
  }
};

/** Fails with 409 if another class already uses this day and time. When editing, excludeId skips the class being edited. */
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

/** Lists classes, optionally only those taught by one instructor. */
export const findAll = async (instructorId?: string): Promise<IClass[]> => {
  return Class.find(instructorId ? { instructorId } : {}).sort({ createdAt: -1 });
};

/** Returns one class, or a 404. */
export const findById = async (id: string): Promise<IClass> => {
  const found = await Class.findById(id);
  if (!found) {
    throw new AppError(404, 'Class not found');
  }
  return found;
};

/** Validates first, then checks the instructor exists and the slot is free, so a bad request never partly saves. */
export const create = async (data: Partial<IClass>): Promise<IClass> => {
  const newClass = new Class(data);
  await newClass.validate();
  await assertInstructorExists(newClass.instructorId);
  await assertSlotFree(newClass.dayOfWeek, newClass.time);
  return newClass.save();
};

/** Applies the changes to the class, then repeats the same checks as create. */
export const update = async (id: string, data: Partial<IClass>): Promise<IClass> => {
  const existing = await findById(id);
  existing.set(data);
  await existing.validate();
  await assertInstructorExists(existing.instructorId);
  await assertSlotFree(existing.dayOfWeek, existing.time, id);
  return existing.save();
};

/** Deletes a class, or a 404 if it doesn't exist. */
export const remove = async (id: string): Promise<void> => {
  const found = await Class.findByIdAndDelete(id);
  if (!found) {
    throw new AppError(404, 'Class not found');
  }
};
