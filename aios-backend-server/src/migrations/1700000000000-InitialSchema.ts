import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "idx_point_transactions_user_id" ON "point_transactions"("userId")
    `);
    
    await queryRunner.query(`
      CREATE INDEX "idx_point_transactions_created_at" ON "point_transactions"("createdAt")
    `);
    
    await queryRunner.query(`
      CREATE INDEX "idx_api_keys_user_id" ON "api_keys"("userId")
    `);
    
    await queryRunner.query(`
      CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions"("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "subscription_status_enum"`);
    
    await queryRunner.query(`DROP TABLE IF EXISTS "point_transactions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "operation_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transaction_type_enum"`);
    
    await queryRunner.query(`DROP TABLE IF EXISTS "api_keys"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "api_provider_enum"`);
    
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
} 