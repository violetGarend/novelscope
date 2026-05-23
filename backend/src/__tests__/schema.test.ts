import { describe, it, expect } from "@jest/globals";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

describe("Prisma Generate", () => {
  it("should generate client successfully", () => {
    const result = execSync("npx prisma generate", {
      cwd: path.resolve(__dirname, "../.."),
      encoding: "utf-8",
    });
    expect(result).toContain("Generated Prisma Client");
  });
});

const SCHEMA_PATH = path.resolve(__dirname, "../../prisma/schema.prisma");
const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");

describe("Prisma Schema", () => {
  it("should have Novel model with genre enum", () => {
    expect(schema).toContain("model Novel");
    expect(schema).toContain("genre");
    expect(schema).toContain("玄幻");
    expect(schema).toContain("都市");
    expect(schema).toContain("仙侠");
    expect(schema).toContain("科幻");
    expect(schema).toContain("历史");
  });

  it("should have Chapter model linked to Novel", () => {
    expect(schema).toContain("model Chapter");
    expect(schema).toContain("novelId");
    expect(schema).toContain("number");
    expect(schema).toContain("content");
  });

  it("should have EvaluationReport model linked to Chapter", () => {
    expect(schema).toContain("model EvaluationReport");
    expect(schema).toContain("chapterId");
    expect(schema).toContain("hookScore");
    expect(schema).toContain("climaxDensity");
    expect(schema).toContain("cliffhangerScore");
    expect(schema).toContain("pacingScore");
    expect(schema).toContain("consistencyIssues");
    expect(schema).toContain("pacingCurve");
    expect(schema).toContain("fillerDetection");
    expect(schema).toContain("isPartial");
    expect(schema).toContain("tokenUsage");
    expect(schema).toContain("costEstimate");
  });

  it("should have CharacterProfile model", () => {
    expect(schema).toContain("model CharacterProfile");
    expect(schema).toContain("aliases");
    expect(schema).toContain("traits");
    expect(schema).toContain("relationships");
    expect(schema).toContain("firstAppearance");
  });

  it("should have SettingConstraint model", () => {
    expect(schema).toContain("model SettingConstraint");
    expect(schema).toContain("isCore");
  });

  it("should have complete relation chain User->Novel->Chapter->EvaluationReport", () => {
    // Verify User has novels relation
    const userBlock = schema.match(/model User \{[\s\S]*?\}/)?.[0] ?? "";
    expect(userBlock).toContain("novels");
    expect(userBlock).toContain("Novel[]");

    // Verify Novel has chapters relation
    const novelBlock = schema.match(/model Novel \{[\s\S]*?\}/)?.[0] ?? "";
    expect(novelBlock).toContain("chapters");
    expect(novelBlock).toContain("Chapter[]");

    // Verify Chapter has FK to Novel
    const chapterBlock = schema.match(/model Chapter \{[\s\S]*?\}/)?.[0] ?? "";
    expect(chapterBlock).toContain("novelId");
    expect(chapterBlock).toContain("Novel");

    // Verify EvaluationReport has FK to Chapter
    const reportBlock = schema.match(/model EvaluationReport \{[\s\S]*?\}/)?.[0] ?? "";
    expect(reportBlock).toContain("chapterId");
    expect(reportBlock).toContain("Chapter");
  });
});
