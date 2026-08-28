import { safeEqual } from "./auth";

function isAuthorizedBearer(req: Request, expected: string | undefined): boolean {
  if (!expected) return false;
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  return safeEqual(header.slice("Bearer ".length), expected);
}

/** Guards /api/webhooks/* — other apps push cost/income events here. */
export function isAuthorizedService(req: Request): boolean {
  return isAuthorizedBearer(req, process.env.KASSENBUCH_SERVICE_TOKEN);
}

/** Guards /api/cron/* — triggered by a scheduled GitHub Actions workflow. */
export function isAuthorizedCron(req: Request): boolean {
  return isAuthorizedBearer(req, process.env.CRON_SECRET);
}
