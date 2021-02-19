import { ArrayType, Entity, PrimaryKey, Property } from '@mikro-orm/core'
import { Enum } from '@mikro-orm/core/decorators/Enum'
import { Field, ObjectType } from 'type-graphql'
import { Role } from '../types'
// enum Role {
//   CLIENT = 'client',
//   ADMIN = 'admin',
// }
@ObjectType()
@Entity()
export class User {
  @Field()
  @PrimaryKey()
  id!: number

  @Field(() => String)
  @Property({ type: 'date' })
  createdAt = new Date()

  @Field(() => String)
  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt = new Date()

  @Field()
  @Property({ type: 'text' })
  email!: string

  @Field()
  @Property({ type: 'text', unique: true })
  username!: string

  @Property({ type: 'text' })
  password!: string

  @Field(() => [String])
  @Property({ type: ArrayType, nullable: false })
  @Enum({ items: () => Role, array: true, default: [Role.Client] })
  roles: Role[] = [Role.Client]
}
