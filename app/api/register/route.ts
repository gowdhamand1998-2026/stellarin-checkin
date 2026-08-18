import {
  registerUser,
  ensureHeaders,
  lookupByPhone,
  checkInExistingUser,
} from "@/lib/sheets";
import { isValidLocation } from "@/lib/locations";

const PHONE_RE = /^\d{10}$/;

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.phone || !data.fullName || !data.skillLevel) {
      return Response.json(
        { error: "Phone, name, and skill level are required" },
        { status: 400 }
      );
    }

    if (typeof data.phone !== "string" || !PHONE_RE.test(data.phone)) {
      return Response.json(
        { error: "Phone must be a 10-digit number" },
        { status: 400 }
      );
    }

    const location = isValidLocation(data.location) ? data.location : "";
    const preferredLocation = isValidLocation(data.preferredLocation)
      ? data.preferredLocation
      : "";

    // Duplicate guard: if this phone is already registered (e.g. the user
    // reached the register form after a transient lookup failure), check the
    // existing member in instead of creating a second row + Stellar ID.
    const existing = await lookupByPhone(data.phone);
    if (existing) {
      const checkin = await checkInExistingUser(data.phone, location);
      return Response.json({
        success: true,
        existing: true,
        name: existing.name,
        uniqueId: existing.uniqueId,
        checkinTime: checkin?.checkinTime || new Date().toISOString(),
      });
    }

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
