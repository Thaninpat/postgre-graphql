import { __prod__ } from './constants'

import { MikroORM } from '@mikro-orm/core'
import path from 'path'
import { Post } from './entities/Post'
import { User } from './entities/User'
// import mySecretKeys from "./secretkeys"

export default {
  migrations: {
    path: path.join(__dirname, './migrations'),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  entities: [Post, User],
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '1234',
  dbName: 'lireddit',
  type: 'postgresql',
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0]
