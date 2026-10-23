import { DataSource } from 'typeorm';

export async function clearDb(ds: DataSource) {
  const qr = ds.createQueryRunner();
  await qr.connect();
  try {
    await qr.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const meta of ds.entityMetadatas) {
      await qr.query(`TRUNCATE TABLE \`${meta.tableName}\``);
    }
    await qr.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    await qr.release();
  }
}

export async function resetDatabase(ds: DataSource) {
  await ds.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const entity of ds.entityMetadatas) {
    await ds.query(`TRUNCATE TABLE \`${entity.tableName}\``);
  }
  await ds.query('SET FOREIGN_KEY_CHECKS = 1');
}
