import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireDeveloperAdmin, requireUserId } from "./authz";
import { rateLimiter } from "./rateLimits";

// Admin invites for #39. Growth stays invite-only: a developer-admin issues an email-bound, single-use, 7-day invite, and the recipient redeems it by signing in with the matching address through the same Google or OTP flow.
// No approval queue, no shared secret, no admin-only method or extra factor.
// Demo-admin cannot issue invites; the denial is server-side in createInvite.

const inviteRole = v.union(
  v.literal("developer-admin"),
  v.literal("demo-admin")
);

// Domain strings with validation bundled in. Normalization and generation
// are the only constructors; the rest of this module passes these around
// instead of bare strings.
const emailPattern = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/u;

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

const normalizeEmail = (email: string): string =>
  stringValue(email).trim().toLowerCase();

const numberToHex = (value: unknown): string => {
  if (typeof value !== "number") {
    return "00";
  }
  const numericValue = BigInt(String(value));
  return numericValue.toString(16).padStart(2, "0");
};

// Unguessable delivery secret: 32 random bytes as 64 hex chars. The token is
// returned once to the issuing admin for out-of-band delivery (email or chat)
// and is never logged or exposed elsewhere, including listInvites.
// Redemption itself is email-bound per the spec: the recipient signs in with
// the matching address through the same Google or OTP flow, and claimInvite
// matches that verified email. The token proves the invite row is
// unguessable; it is not presented at claim time.
const newToken = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let token = "";
  for (const byte of bytes) {
    token += numberToHex(byte);
  }
  return token;
};

const sevenDaysMs = 604_800_000;
export { sevenDaysMs as SEVEN_DAYS_MS };

// Issue one invite. Developer-admin only; demo-admin, applicants, and
// anonymous callers are denied. Returns the token once; the caller delivers
// it out-of-band.
const issueInvite = mutation({
  args: { email: v.string(), role: inviteRole },
  handler: async (context, requestArguments) => {
    const createdBy = await requireDeveloperAdmin(context);
    await rateLimiter.limit(context, "inviteCreate", {
      key: createdBy,
      throws: true,
    });
    const email = normalizeEmail(requestArguments.email);
    if (!emailPattern.test(email)) {
      throw new ConvexError("Invite needs a valid email address.");
    }
    const token = newToken();
    const now = Date.now();
    await context.db.insert("invites", {
      createdBy,
      email,
      expiresAt: now + sevenDaysMs,
      role: requestArguments.role,
      token,
    });
    return { token };
  },
});
export { issueInvite as createInvite };

// Redeem the caller's invite. The caller must be signed in with a verified
// email matching an unexpired, unused invite; the users row is the email
// source of truth, not the JWT. The mutation sets usedAt in the same call,
// which enforces single-use (check-then-set: correct under normal use, soft
// under a truly concurrent double-claim since Convex has no unique
// constraint; accepted for a demo). It sets the caller's role and returns
// it. Redeeming twice throws, as do expired invites and wrong-email
// sign-ins.
export const claimInvite = mutation({
  args: {},
  handler: async (context) => {
    const userId = await requireUserId(context);
    await rateLimiter.limit(context, "inviteClaim", {
      key: userId,
      throws: true,
    });
    const user = await context.db.get(userId);
    const email = stringValue(user?.email?.trim().toLowerCase());
    if (email === "") {
      throw new ConvexError(
        "Sign in with an email address before claiming an invite."
      );
    }
    if (user?.emailVerificationTime === undefined) {
      throw new ConvexError("Verify your email before claiming an invite.");
    }
    const normalizedEmail = stringValue(email);
    const now = Date.now();
    const candidates = await context.db
      .query("invites")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .collect();
    const [invite] = candidates
      .filter((row) => row.usedAt === undefined && row.expiresAt >= now)
      .toSorted((a, b) => b.expiresAt - a.expiresAt);
    if (!invite) {
      throw new ConvexError(
        "No unused, unexpired invite matches this sign-in email."
      );
    }
    if (invite.usedAt !== undefined) {
      throw new ConvexError("This invite was already redeemed.");
    }
    await context.db.patch(invite._id, { usedAt: now });
    await context.db.patch(userId, { role: invite.role });
    return { role: invite.role };
  },
});

// Outstanding invites for the developer-admin invites page. Tokens are never
// returned here; the token is shown once by createInvite only.
export const listInvites = query({
  args: {},
  handler: async (context) => {
    await requireDeveloperAdmin(context);
    const rows = await context.db.query("invites").collect();
    const sortedRows = rows.toSorted((a, b) => b.expiresAt - a.expiresAt);
    return sortedRows.slice(0, 200).map((row) => {
      const usedAt = row.usedAt ?? null;
      return {
        createdBy: row.createdBy,
        email: row.email,
        expiresAt: row.expiresAt,
        inviteId: row._id,
        role: row.role,
        usedAt,
      };
    });
  },
});
