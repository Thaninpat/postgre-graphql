import { Migration } from '@mikro-orm/migrations';

export class Migration20210301042639 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" drop constraint if exists "user_reset_password_token_check";');
    this.addSql('alter table "user" alter column "reset_password_token" type varchar(255) using ("reset_password_token"::varchar(255));');
    this.addSql('alter table "user" alter column "reset_password_token" set not null;');
    this.addSql('alter table "user" drop constraint if exists "user_reset_password_token_expiry_check";');
    this.addSql('alter table "user" alter column "reset_password_token_expiry" type int4 using ("reset_password_token_expiry"::int4);');
    this.addSql('alter table "user" alter column "reset_password_token_expiry" set not null;');

    this.addSql('alter table "user" add constraint "user_email_unique" unique ("email");');
  }

}
