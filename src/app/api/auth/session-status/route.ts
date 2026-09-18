import { NextResponse } from "next/server";

import { getCurrentSession } from "elestampadero/server/auth/current-session";

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session?.user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { authenticated: true, role: session.user.role },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { authenticated: false },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
}
