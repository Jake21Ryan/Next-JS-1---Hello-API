import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";

function dbName() {
  return process.env.MONGODB_DB || "sample_mflix";
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/items?page=1&limit=5
export async function GET(req) {
  try {
    const client = await getClientPromise();
    const db = client.db(dbName());
    const itemsCol = db.collection("items");

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "5", 10), 1), 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      itemsCol.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      itemsCol.countDocuments(),
    ]);

    return NextResponse.json(
      {
        items,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      { headers: corsHeaders }
    );
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

// POST /api/items
export async function POST(req) {
  try {
    const body = await req.json();

    if (!body.itemName || !body.itemCategory || body.itemPrice === undefined || !body.status) {
      return NextResponse.json(
        { error: "Missing fields: itemName, itemCategory, itemPrice, status" },
        { status: 400, headers: corsHeaders }
      );
    }

    const doc = {
      itemName: String(body.itemName).trim(),
      itemCategory: String(body.itemCategory).trim(),
      itemPrice: Number(body.itemPrice),
      status: String(body.status), // e.g. "active" / "inactive"
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const client = await getClientPromise();
    const db = client.db(dbName());
    const itemsCol = db.collection("items");

    const result = await itemsCol.insertOne(doc);

    return NextResponse.json(
      { _id: result.insertedId, ...doc },
      { status: 201, headers: corsHeaders }
    );
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400, headers: corsHeaders });
  }
}
