import { __prod__ } from './constants'
import { MikroORM } from '@mikro-orm/core'
import { Post } from './entities/Post'
import { User } from './entities/User'

import path from 'path'
// import mySecretKeys from "./secretkeys"
import { config } from 'dotenv'
config()

const {
  HOST,
  POSTGRES_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
} = process.env

export default {
  migrations: {
    path: path.join(__dirname, './migrations'), // select path create file  Migration**.ts
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  entities: [Post, User],
  host: HOST,
  port: POSTGRES_PORT,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  dbName: POSTGRES_DB,
  type: 'postgresql',
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0]
