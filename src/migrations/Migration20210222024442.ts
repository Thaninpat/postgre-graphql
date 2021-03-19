import { Migration } from '@mikro-orm/migrations'

export class Migration20210222024442 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "user" add column "reset_password_token" varchar(255) null, add column "reset_password_token_expiry" varchar(50) null;'
    )
  }
}
