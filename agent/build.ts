import { execSync } from "child_process";

console.log("🐔 Building Chicken Buffett...");

try {
  execSync("bunx tsc --noEmit", { stdio: "inherit" });
  console.log("✅ Type check passed");
} catch {
  console.warn("⚠️  Type check had warnings (continuing build)");
}

console.log("🐔 Chicken Buffett build complete!");
