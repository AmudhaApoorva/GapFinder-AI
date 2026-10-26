import { ensureDemoData } from "../lib/seed-demo";

async function main() {
  await ensureDemoData();
  console.log("Seeded judge@gapfinder.ai / Demo@123");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
