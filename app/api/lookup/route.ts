import { lookupByPhone } from "@/lib/sheets";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return Response.json({ error: "Phone number required" }, { status: 400 });
    }

    if (typeof phone !== "string" || !/^\d{10}$/.test(phone)) {
      return Response.json(
        { error: "Phone must be a 10-digit number" },
        { status: 400 }
      );
    }

    const user = await lookupByPhone(phone);

    if (user) {
      return Response.json(user);
    }

    return Response.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    console.error("Lookup error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
