import { __prod__ } from './constants'
import { Post } from './entities/Post'
import { MikroORM } from '@mikro-orm/core'
import path from 'path'
// import mySecretKeys from "./secretkeys"

export default {
  migrations: {
    path: path.join(__dirname, './migrations'),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  entities: [Post],
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '123456',
  dbName: 'lireddit',
  type: 'postgresql',
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0]
