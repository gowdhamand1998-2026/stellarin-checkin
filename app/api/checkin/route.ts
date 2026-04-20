import { checkInExistingUser } from "@/lib/sheets";
import { isValidLocation } from "@/lib/locations";

export async function POST(request: Request) {
  try {
    const { phone, location } = await request.json();

    if (!phone) {
      return Response.json({ error: "Phone number required" }, { status: 400 });
    }

    const checkinLocation = isValidLocation(location) ? location : "";

    const result = await checkInExistingUser(phone, checkinLocation);

    if (!result) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error("Check-in error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
