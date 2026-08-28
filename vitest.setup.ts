import { config } from "dotenv";

// Local dev only: fills in DATABASE_URL etc. from .env.local. In CI these are
// already set by the workflow, and dotenv never overrides an existing value.
config({ path: ".env.local" });
