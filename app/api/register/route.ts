import { registerUser, ensureHeaders } from "@/lib/sheets";
import { isValidLocation } from "@/lib/locations";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.phone || !data.fullName || !data.skillLevel) {
      return Response.json(
        { error: "Phone, name, and skill level are required" },
        { status: 400 }
      );
    }

    const location = isValidLocation(data.location) ? data.location : "";
    const preferredLocation = isValidLocation(data.preferredLocation)
      ? data.preferredLocation
      : "";

    await ensureHeaders();

    const { uniqueId, checkinTime } = await registerUser({
      phone: data.phone,
      fullName: data.fullName.trim(),
      skillLevel: data.skillLevel,
      homeLocation: location, // from landing page
      checkinLocation: location, // log today's check-in at same location
      preferredLocation, // user's chosen preferred location
      preferredSport: data.preferredSport || "",
      instagram: data.instagram || "",
      whatsappOptIn: data.whatsappOptIn ?? true,
      imageConsent: data.imageConsent ?? true,
    });

    return Response.json({ success: true, uniqueId, checkinTime });
  } catch (error) {
    console.error("Register error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
