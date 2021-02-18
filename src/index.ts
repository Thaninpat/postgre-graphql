import { MikroORM } from '@mikro-orm/core'
// import { Post } from './entities/Post'
import microConfig from './mikro-orm.config'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'

const main = async () => {
  const orm = await MikroORM.init(microConfig)
  // run migration
  await orm.getMigrator().up()

  const app = express()

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [],
      validate: false,
    }),
  })

  app.listen(8080, () => console.log('http://localhost:8080'))
}

main().catch((err) => console.log(err))
