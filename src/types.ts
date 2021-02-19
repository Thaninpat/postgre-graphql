import { EntityManager, IDatabaseDriver, Connection } from '@mikro-orm/core'
import { Request, Response } from 'express'
import { Session, SessionData } from 'express-session'
// import { Redis } from 'ioredis'
export enum Role {
  Client = 'client',
  Admin = 'admin',
  Sale = 'sale',
  Reader = 'reader',
  ItemEditor = 'itemEditor',
  SuperAdmin = 'superAdmin',
}

export type MyContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>
  req: Request & {
    session: Session & Partial<SessionData> & { userId: number }
  }
  // redis: Redis
  res: Response
}
