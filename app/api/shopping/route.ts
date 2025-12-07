import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const label = searchParams.get("label");

    // Caso 1: query per ID
    if (id) {
      const item = await prisma.shoppingItem.findUnique({ where: { id } });
      if (!item) {
        return NextResponse.json({ error: "not-found" }, { status: 404 });
      }
      return NextResponse.json(item);
    }

    // Caso 2: query per LABEL
    if (label) {
      const item = await prisma.shoppingItem.findUnique({ where: { label } });
      if (!item) {
        return NextResponse.json({ error: "not-found" }, { status: 404 });
      }
      return NextResponse.json(item);
    }

    // Caso 3: nessun query param -> ritorna tutti
    const items = await prisma.shoppingItem.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "get-failed" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const label = searchParams.get("label");

    if (id && label) {
      return NextResponse.json(
        { error: "specify-only-one-of-id-or-label" },
        { status: 400 },
      );
    }
    if (!id && !label) {
      return NextResponse.json(
        { error: "missing-id-or-label" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const quantity = Number(body.quantity);

    if (!Number.isFinite(quantity) || quantity < 0) {
      return NextResponse.json({ error: "invalid-quantity" }, { status: 400 });
    }

    const where = id ? { id } : { label: label as string };

    const item = await prisma.shoppingItem.update({
      where,
      data: { quantity },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "update-failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const label = body.label.toLowerCase().trim();
    const quantity = typeof body.quantity === "number" ? body.quantity : 1;

    // 1. Cerchiamo se esiste già
    const existing = await prisma.shoppingItem.findUnique({
      where: { label }, // Assicurati che 'label' sia @unique nel tuo schema Prisma!
    });

    let item;
    if (existing) {
      // 2. Se esiste, aggiorniamo (Logica Server-Side)
      item = await prisma.shoppingItem.update({
        where: { id: existing.id },
        data: { quantity: (existing.quantity || 0) + quantity },
      });
    } else {
      // 3. Se non esiste, creiamo
      item = await prisma.shoppingItem.create({
        data: { label, quantity },
      });
    }

    return NextResponse.json(item);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "create-failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const label = searchParams.get("label");

    // Se arrivano *entrambi*, meglio rispondere errore esplicito
    if (id && label) {
      return NextResponse.json(
        { error: "specify-only-one-of-id-or-label" },
        { status: 400 },
      );
    }

    // Cancella per id
    if (id) {
      await prisma.shoppingItem.delete({ where: { id } });
      return NextResponse.json({ ok: true, deletedCount: 1 });
    }

    // Cancella per label
    if (label) {
      await prisma.shoppingItem.delete({ where: { label } });
      return NextResponse.json({ ok: true, deletedCount: 1 });
    }

    // Nessun filtro -> cancella tutti
    const result = await prisma.shoppingItem.deleteMany({});
    return NextResponse.json({ ok: true, deletedCount: result.count });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "delete-failed" }, { status: 500 });
  }
}
