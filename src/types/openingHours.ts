export type OpeningHourDay = {
  isOpen: boolean;
  open: string | null;
  close: string | null;
};

export type OpeningHours = {
  monday: OpeningHourDay;
  tuesday: OpeningHourDay;
  wednesday: OpeningHourDay;
  thursday: OpeningHourDay;
  friday: OpeningHourDay;
  saturday: OpeningHourDay;
  sunday: OpeningHourDay;
};