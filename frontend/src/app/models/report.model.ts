/** One row of each report, as the API returns it. */
export interface PackageSalesRow {
  packageName: string;
  sold: number;
  revenue: number;
}

export interface InstructorRow {
  instructorId: string;
  name: string;
  classes: string[];
  checkIns: number;
}

export interface CustomerRow {
  name: string;
  classBalance: number;
  packages: { packageName: string; status: 'active' | 'future' | 'expired' }[];
}

/** Used by both the teacher payment report and an instructor's own performance. */
export interface PaymentRow {
  instructorId: string;
  name: string;
  classesHeld: number;
  checkIns: number;
  pay: number;
}
