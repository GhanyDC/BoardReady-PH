import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/group-progress/:path*",
    "/onboarding/:path*",
    "/readiness/:path*",
    "/study-habits/:path*",
    "/study-timer/:path*",
    "/study-logs/:path*",
    "/practice/:path*",
    "/missed-questions/:path*",
    "/weak-areas/:path*",
    "/analytics/:path*",
    "/external-drills/:path*",
    "/mock-exams/:path*",
    "/submit-question/:path*",
    "/login",
    "/signup",
  ],
};
