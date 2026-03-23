import { mutation } from "./_generated/server";

export default mutation({
  handler: async (ctx) => {
    const pages = await ctx.db.query("pages").collect();
    const seenSlugs = new Set();
    let deletedCount = 0;

    for (const page of pages) {
      if (seenSlugs.has(page.slug)) {
        await ctx.db.delete(page._id);
        deletedCount++;
      } else {
        seenSlugs.add(page.slug);
      }
    }

    return `Removed ${deletedCount} duplicate pages.`;
  },
});
