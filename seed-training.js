import { ensureSchema, seedTrainingCatalog } from './server/setup.js';

async function main() {
  try {
    await ensureSchema();
    await seedTrainingCatalog();
    console.log('Training catalog seeded successfully.');
  } catch (error) {
    console.error('Failed to seed training catalog.');
    console.error(error);
    process.exitCode = 1;
  }
}

main();
