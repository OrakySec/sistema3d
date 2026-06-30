export type RecurringFrequency = "WEEKLY" | "MONTHLY" | "YEARLY";

export function addInterval(date: Date, frequency: RecurringFrequency): Date {
  const next = new Date(date);
  if (frequency === "WEEKLY") next.setDate(next.getDate() + 7);
  else if (frequency === "MONTHLY") next.setMonth(next.getMonth() + 1);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  WEEKLY:  "Semanal",
  MONTHLY: "Mensal",
  YEARLY:  "Anual",
};
