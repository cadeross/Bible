import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null;
      return {
        _id: null,
        userId: identity.subject,
        email: identity.email ?? null,
        name: identity.name ?? null,
        image: identity.pictureUrl ?? null,
        creationTime: null,
        provider: "clerk" as const,
      };
    }
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      _id: user._id,
      userId: user._id as string,
      email: (user.email as string | undefined) ?? null,
      name: (user.name as string | undefined) ?? null,
      image: (user.image as string | undefined) ?? null,
      creationTime: user._creationTime,
      provider: "convex" as const,
    };
  },
});
