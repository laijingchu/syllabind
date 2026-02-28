import { injectOgTags, parseBinderIdFromUrl } from "../utils/ogTags";
import type { Binder } from "@shared/schema";

const TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta property="og:title" content="Syllabind" />
<meta property="og:description" content="A calm web platform where thought leaders bind the best of the web into multi-week binders." />
<meta property="og:type" content="website" />
<meta property="og:image" content="https://example.com/opengraph.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Syllabind" />
<meta name="twitter:description" content="A calm web platform where thought leaders bind the best of the web into multi-week binders." />
<meta name="twitter:image" content="https://example.com/opengraph.png" />
</head>
<body><div id="root"></div></body>
</html>`;

const mockBinder: Binder = {
  id: 42,
  title: "Digital Minimalism",
  description: "Learn to live intentionally with technology.",
  audienceLevel: "Beginner",
  durationWeeks: 4,
  status: "published",
  curatorId: "janesmith",
  createdAt: new Date(),
  updatedAt: new Date(),
  readerActive: 10,
  readersCompleted: 3,
};

describe("ogTags", () => {
  describe("parseBinderIdFromUrl", () => {
    it("extracts ID from /binder/:id", () => {
      expect(parseBinderIdFromUrl("/binder/42")).toBe(42);
    });

    it("extracts ID from /binder/:id with trailing path", () => {
      expect(parseBinderIdFromUrl("/binder/42/week/1")).toBe(42);
    });

    it("returns null for non-binder URLs", () => {
      expect(parseBinderIdFromUrl("/")).toBeNull();
      expect(parseBinderIdFromUrl("/catalog")).toBeNull();
      expect(parseBinderIdFromUrl("/dashboard")).toBeNull();
    });

    it("returns null for invalid IDs", () => {
      expect(parseBinderIdFromUrl("/binder/abc")).toBeNull();
      expect(parseBinderIdFromUrl("/binder/")).toBeNull();
    });
  });

  describe("injectOgTags", () => {
    it("replaces og:title and twitter:title", () => {
      const result = injectOgTags(TEMPLATE_HTML, mockBinder);
      expect(result).toContain(
        '<meta property="og:title" content="Digital Minimalism | Syllabind" />',
      );
      expect(result).toContain(
        '<meta name="twitter:title" content="Digital Minimalism | Syllabind" />',
      );
    });

    it("replaces og:description and twitter:description", () => {
      const result = injectOgTags(TEMPLATE_HTML, mockBinder);
      expect(result).toContain(
        '<meta property="og:description" content="Learn to live intentionally with technology." />',
      );
      expect(result).toContain(
        '<meta name="twitter:description" content="Learn to live intentionally with technology." />',
      );
    });

    it("does not modify og:image or og:type", () => {
      const result = injectOgTags(TEMPLATE_HTML, mockBinder);
      expect(result).toContain(
        '<meta property="og:type" content="website" />',
      );
      expect(result).toContain(
        '<meta property="og:image" content="https://example.com/opengraph.png" />',
      );
    });

    it("escapes HTML entities in title and description", () => {
      const xssBinder: Binder = {
        ...mockBinder,
        title: 'Test <script>alert("xss")</script>',
        description: 'Desc with "quotes" & <tags>',
      };
      const result = injectOgTags(TEMPLATE_HTML, xssBinder);
      expect(result).toContain("&lt;script&gt;");
      expect(result).toContain("&amp;");
      expect(result).toContain("&quot;quotes&quot;");
      expect(result).not.toContain('<script>alert');
    });
  });
});
