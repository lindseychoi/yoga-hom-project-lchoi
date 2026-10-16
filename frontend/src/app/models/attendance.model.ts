/** One customer on an attendance sheet. negativeBalance means they were saved anyway without enough classes. */
export interface AttendanceEntry {
  customerId: string;
  balanceAfter: number;
  negativeBalance: boolean;
}

/** One class session's attendance sheet as the API returns it. */
export interface Attendance {
  _id: string;
  classId: string;
  instructorId: string;
  date: string;
  time: string;
  entries: AttendanceEntry[];
}
