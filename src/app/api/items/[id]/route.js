import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

function dbName() {
  return process.env.MONGODB_DB || "sample_mflix";
}

function tryObjectId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/items/:id
export async function GET(_req, { params }) {
  try {
    const client = await getClientPromise();
    const db = client.db(dbName());
    const itemsCol = db.collection("items");

    // 1) try string id first
    let item = await itemsCol.findOne({ _id: params.id });

    // 2) then try ObjectId
    if (!item) {
      const oid = tryObjectId(params.id);
      if (oid) item = await itemsCol.findOne({ _id: oid });
    }

    if (!item) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(item, { headers: corsHeaders });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Invalid id" },
      { status: 400, headers: corsHeaders }
    );
  }
}

// PUT /api/items/:id
export async function PUT(req, { params }) {
  try {
    const body = await req.json();

    const updateDoc = {
      ...(body.itemName !== undefined ? { itemName: String(body.itemName).trim() } : {}),
      ...(body.itemCategory !== undefined ? { itemCategory: String(body.itemCategory).trim() } : {}),
      ...(body.itemPrice !== undefined ? { itemPrice: Number(body.itemPrice) } : {}),
      ...(body.status !== undefined ? { status: String(body.status) } : {}),
      updatedAt: new Date(),
    };

    const client = await getClientPromise();
    const db = client.db(dbName());
    const itemsCol = db.collection("items");

    // 1) try string id first
    let result = await itemsCol.findOneAndUpdate(
      { _id: params.id },
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    // 2) then try ObjectId
    if (!result.value) {
      const oid = tryObjectId(params.id);
      if (oid) {
        result = await itemsCol.findOneAndUpdate(
          { _id: oid },
          { $set: updateDoc },
          { returnDocument: "after" }
        );
      }
    }

    if (!result.value) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(result.value, { headers: corsHeaders });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Invalid id or body" },
      { status: 400, headers: corsHeaders }
    );
  }
}

// DELETE /api/items/:id
export async function DELETE(_req, { params }) {
  try {
    const client = await getClientPromise();
    const db = client.db(dbName());
    const itemsCol = db.collection("items");

    // 1) try string id first
    let result = await itemsCol.deleteOne({ _id: params.id });

    // 2) then try ObjectId
    if (result.deletedCount === 0) {
      const oid = tryObjectId(params.id);
      if (oid) result = await itemsCol.deleteOne({ _id: oid });
    }

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Invalid id" },
      { status: 400, headers: corsHeaders }
    );
  }
}
