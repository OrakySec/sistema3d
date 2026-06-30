import { prisma } from "@/lib/prisma";
import { addInterval, type RecurringFrequency } from "@/lib/recurring";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.expense.findMany({
    where: { isRecurring: true, nextOccurrence: { lte: now } },
  });

  let generated = 0;
  for (const template of due) {
    if (!template.recurringFrequency) continue;
    let occurrence = template.nextOccurrence!;
    let next = occurrence;

    // Gera todas as ocorrências em atraso (ex: serviço ficou fora do ar por semanas)
    while (occurrence <= now) {
      await prisma.expense.create({
        data: {
          userId:         template.userId,
          category:       template.category,
          customCategory: template.customCategory,
          description:    template.description,
          amount:         template.amount,
          date:           occurrence,
          notes:          template.notes,
          isRecurring:    true,
          recurringFrequency: template.recurringFrequency,
          nextOccurrence: null,
          generatedFromId: template.id,
        },
      });
      generated++;
      next = addInterval(occurrence, template.recurringFrequency as RecurringFrequency);
      occurrence = next;
    }

    await prisma.expense.update({
      where: { id: template.id },
      data:  { nextOccurrence: next },
    });
  }

  return NextResponse.json({ ok: true, templatesProcessed: due.length, generated });
}
