export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
export const CLASS_TYPES = ['General', 'Special'] as const;

export interface YogaClass {
  _id: string;
  instructorId: string;
  dayOfWeek: (typeof DAYS_OF_WEEK)[number];
  time: string;
  classType: (typeof CLASS_TYPES)[number];
  className: string;
  payRate: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
