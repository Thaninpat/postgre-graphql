import { Migration } from '@mikro-orm/migrations';

export class Migration20210318023138 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" drop column "reset_password_token";');
    this.addSql('alter table "user" drop column "reset_password_token_expiry";');
  }

}
