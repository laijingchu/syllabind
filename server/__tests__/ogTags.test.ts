import { injectOgTags, parseSyllabindIdFromUrl } from "../utils/ogTags";
import type { Syllabus } from "@shared/schema";

const TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta property="og:title" content="Syllabind" />
<meta property="og:description" content="A calm web platform where thought leaders bind the best of the web into 4-week syllabi." />
<meta property="og:type" content="website" />
<meta property="og:image" content="https://example.com/opengraph.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Syllabind" />
<meta name="twitter:description" content="A calm web platform where thought leaders bind the best of the web into 4-week syllabi." />
<meta name="twitter:image" content="https://example.com/opengraph.png" />
</head>
<body><div id="root"></div></body>
</html>`;

const mockSyllabus: Syllabus = {
  id: 42,
  title: "Digital Minimalism",
  description: "Learn to live intentionally with technology.",
  audienceLevel: "Beginner",
  durationWeeks: 4,
  status: "published",
  creatorId: "janesmith",
  createdAt: new Date(),
  updatedAt: new Date(),
  studentActive: 10,
  studentsCompleted: 3,
};

describe("ogTags", () => {
  describe("parseSyllabindIdFromUrl", () => {
    it("extracts ID from /syllabind/:id", () => {
      expect(parseSyllabindIdFromUrl("/syllabind/42")).toBe(42);
    });

    it("extracts ID from /syllabind/:id with trailing path", () => {
      expect(parseSyllabindIdFromUrl("/syllabind/42/week/1")).toBe(42);
    });

    it("returns null for non-syllabind URLs", () => {
      expect(parseSyllabindIdFromUrl("/")).toBeNull();
      expect(parseSyllabindIdFromUrl("/catalog")).toBeNull();
      expect(parseSyllabindIdFromUrl("/dashboard")).toBeNull();
    });

    it("returns null for invalid IDs", () => {
      expect(parseSyllabindIdFromUrl("/syllabind/abc")).toBeNull();
      expect(parseSyllabindIdFromUrl("/syllabind/")).toBeNull();
    });
  });

  describe("injectOgTags", () => {
    it("replaces og:title and twitter:title", () => {
      const result = injectOgTags(TEMPLATE_HTML, mockSyllabus);
      expect(result).toContain(
        '<meta property="og:title" content="Digital Minimalism | Syllabind" />',
      );
      expect(result).toContain(
        '<meta name="twitter:title" content="Digital Minimalism | Syllabind" />',
      );
    });

    it("replaces og:description and twitter:description", () => {
      const result = injectOgTags(TEMPLATE_HTML, mockSyllabus);
      expect(result).toContain(
        '<meta property="og:description" content="Learn to live intentionally with technology." />',
      );
      expect(result).toContain(
        '<meta name="twitter:description" content="Learn to live intentionally with technology." />',
      );
    });

    it("does not modify og:image or og:type", () => {
      const result = injectOgTags(TEMPLATE_HTML, mockSyllabus);
      expect(result).toContain(
        '<meta property="og:type" content="website" />',
      );
      expect(result).toContain(
        '<meta property="og:image" content="https://example.com/opengraph.png" />',
      );
    });

    it("escapes HTML entities in title and description", () => {
      const xssSyllabus: Syllabus = {
        ...mockSyllabus,
        title: 'Test <script>alert("xss")</script>',
        description: 'Desc with "quotes" & <tags>',
      };
      const result = injectOgTags(TEMPLATE_HTML, xssSyllabus);
      expect(result).toContain("&lt;script&gt;");
      expect(result).toContain("&amp;");
      expect(result).toContain("&quot;quotes&quot;");
      expect(result).not.toContain('<script>alert');
    });
  });
});
