import 'reflect-metadata'
import { config } from 'dotenv'
config()
import microConfig from './mikro-orm.config'

import express from 'express'
import { MikroORM } from '@mikro-orm/core'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'

// import { HelloResolver } from './resolvers/hello'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'

import Redis from 'ioredis'
// const Redis = require('ioredis')

import session from 'express-session'
import connectRedis from 'connect-redis'
import { __prod__ } from './constants'

// import { User } from './entities/User'

const { PORT, FRONTEND_URI, COOKIE_NAME, SECRET_KEY } = process.env
// const secretKey = process.env.SECRET_KEY

const main = async () => {
  const orm = await MikroORM.init(microConfig)
  // await orm.em.nativeDelete(User, {})
  // run migration
  await orm.getMigrator().up()

  const app = express()

  const RedisStore = connectRedis(session)
  const redis = new Redis()
  // let RedisStore = require('connect-redis')(session)
  // let redis = redis.createClient()
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30 * 2, // 30 day
        httpOnly: true,
        sameSite: 'lax', // csrf
        secure: __prod__, // cookie only works in http
      },
      saveUninitialized: false,
      secret: SECRET_KEY!,
      resave: false,
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ em: orm.em, req, res, redis }),
  })
  apolloServer.applyMiddleware({
    app,
    cors: { origin: FRONTEND_URI, credentials: true },
  })

  app.listen(PORT, () =>
    console.log(`http://localhost:${PORT}${apolloServer.graphqlPath}`)
  )
}

main().catch((err) => console.log(err))
