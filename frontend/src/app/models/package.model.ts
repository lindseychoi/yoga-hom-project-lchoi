// These lists must match the values the backend accepts.
export const PACKAGE_CATEGORIES = ['General', 'Senior'] as const;
/** Stored in numberOfClasses for an unlimited package. */
export const UNLIMITED = -1;
export const CLASS_COUNTS = [1, 4, 10, UNLIMITED];

/** A package as the API returns it. Dates come back as ISO strings. */
export interface Package {
  _id: string;
  packageId: string;
  packageName: string;
  packageCategory: (typeof PACKAGE_CATEGORIES)[number];
  numberOfClasses: number;
  classType: 'General' | 'Special';
  startDate: string;
  endDate: string;
  price: number;
}
