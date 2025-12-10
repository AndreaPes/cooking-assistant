import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API Route for managing the Shopping List persistence layer.
 * * This endpoint handles CRUD operations using Prisma (PostgreSQL/SQLite).
 * It serves as the "Source of Truth" for the shopping list, allowing the AR
 * interface to sync data across sessions.
 */

/**
 * Retrieves shopping list items.
 *
 * Modes:
 * 1. **Get by ID**: ?id=... (Returns single item)
 * 2. **Get by Label**: ?label=... (Returns single item)
 * 3. **Get All**: No parameters (Returns list ordered by creation date desc)
 *
 * @param req - The HTTP request containing query parameters.
 * @returns JSON response with the requested item(s) or an error.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const label = searchParams.get("label");

    // Case 1: Fetch by unique ID
    if (id) {
      const item = await prisma.shoppingItem.findUnique({ where: { id } });
      if (!item) {
        return NextResponse.json({ error: "not-found" }, { status: 404 });
      }
      return NextResponse.json(item);
    }

    // Case 2: Fetch by exact Label
    if (label) {
      const item = await prisma.shoppingItem.findUnique({ where: { label } });
      if (!item) {
        return NextResponse.json({ error: "not-found" }, { status: 404 });
      }
      return NextResponse.json(item);
    }

    // Case 3: Fetch Full List
    const items = await prisma.shoppingItem.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "get-failed" }, { status: 500 });
  }
}

/**
 * Updates an existing item's quantity.
 *
 * Validations:
 * - Requires either `id` OR `label` in query params.
 * - Quantity must be a finite number >= 0.
 *
 * @param req - The HTTP request containing the target (query) and new quantity (body).
 * @returns The updated item object.
 */
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

/**
 * Adds a new item or increments the quantity of an existing one (Upsert Logic).
 *
 * This prevents duplicate entries for the same item name (e.g., "milk").
 *
 * Logic:
 * 1. Normalize label to lowercase.
 * 2. Check if item exists in DB.
 * 3. If EXISTS: Update record by adding new quantity to existing quantity.
 * 4. If NEW: Create a fresh record.
 *
 * @param req - The HTTP request containing { label, quantity }.
 * @returns The created or updated item.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const label = body.label.toLowerCase().trim();
    const quantity = typeof body.quantity === "number" ? body.quantity : 1;

    // 1. Check for duplicates
    const existing = await prisma.shoppingItem.findUnique({
      where: { label }, // Requires 'label' to be @unique in Prisma Schema
    });

    let item;
    if (existing) {
      // 2. Logic: Merge/Increment (Server-Side Calculation)
      item = await prisma.shoppingItem.update({
        where: { id: existing.id },
        data: { quantity: (existing.quantity || 0) + quantity },
      });
    } else {
      // 3. Logic: Create New
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

/**
 * Removes items from the shopping list.
 *
 * Modes:
 * 1. **Delete by ID**: ?id=...
 * 2. **Delete by Label**: ?label=... (Removes by name, case-insensitive)
 * 3. **Clear All**: No parameters (Truncates the list)
 *
 * @param req - The HTTP request containing optional filter parameters.
 * @returns Status object { ok: true, deletedCount: number }.
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const label = searchParams.get("label");

    // Prevent ambiguous requests
    if (id && label) {
      return NextResponse.json(
        { error: "specify-only-one-of-id-or-label" },
        { status: 400 },
      );
    }

    // Mode 1: Delete specific item by ID
    if (id) {
      await prisma.shoppingItem.delete({ where: { id } });
      return NextResponse.json({ ok: true, deletedCount: 1 });
    }

    // Mode 2: Delete item by Label
    if (label) {
      const result = await prisma.shoppingItem.deleteMany({
        where: { label: label.toLowerCase().trim() },
      });
      return NextResponse.json({ ok: true, deletedCount: result.count });
    }

    // Mode 3: Clear entire list (Delete All)
    const result = await prisma.shoppingItem.deleteMany({});
    return NextResponse.json({ ok: true, deletedCount: result.count });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "delete-failed" }, { status: 500 });
  }
}
