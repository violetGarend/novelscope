import fs from "fs";
import path from "path";

const CHAPTER_DIR = path.resolve(__dirname, "../../../测试用文");

export function getRandomTestChapter(): string {
  const files = fs.readdirSync(CHAPTER_DIR).filter((f) => f.endsWith(".md"));
  if (files.length === 0) throw new Error(`No chapter files found in ${CHAPTER_DIR}`);
  const file = files[Math.floor(Math.random() * files.length)];
  return fs.readFileSync(path.join(CHAPTER_DIR, file), "utf-8");
}
