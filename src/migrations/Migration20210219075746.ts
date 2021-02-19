import { Migration } from '@mikro-orm/migrations';

export class Migration20210219075746 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "user" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "email" text not null, "username" text not null, "password" text not null, "roles" text[] not null);');
    this.addSql('alter table "user" add constraint "user_username_unique" unique ("username");');
  }

}
