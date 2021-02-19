import argon2 from 'argon2'
import { User } from '../entities/User'
import { MyContext } from '../types'
import {
  Resolver,
  Mutation,
  Arg,
  Field,
  Ctx,
  InputType,
  ObjectType,
  Query,
} from 'type-graphql'
import { validateEmail } from '../utils/validate'

@InputType()
class RegisterInput {
  @Field()
  email: string
  @Field()
  username: string
  @Field()
  password: string
}

@InputType()
class LoginInput {
  @Field()
  username: string
  @Field()
  password: string
}

@ObjectType()
class FieldError {
  @Field()
  field: string
  @Field()
  message: string
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: MyContext): Promise<User | null> {
    if (!req.session.userId) {
      return null
    }
    const user = await em.findOne(User, { id: req.session.userId })
    return user
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: RegisterInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const isEmailValid = validateEmail(options.email)

    if (!isEmailValid) {
      return {
        errors: [
          {
            field: 'email',
            message: 'Email is invalid.',
          },
        ],
      }
    }

    if (options.username.length <= 2) {
      return {
        errors: [
          {
            field: 'username',
            message: 'length must be greater than 2 characters',
          },
        ],
      }
    }
    const checkUser = await em.findOne(User, { username: options.username })
    if (checkUser) {
      return {
        errors: [
          {
            field: 'username',
            message: 'username is already taken.',
          },
        ],
      }
    }
    if (options.password.length <= 3) {
      return {
        errors: [
          {
            field: 'password',
            message: 'length must be greater than 3 characters',
          },
        ],
      }
    }
    const hashedPassword = await argon2.hash(options.password)
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
      email: options.email,
    })
    await em.persistAndFlush(user)

    req.session.userId = user.id
    return { user }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: LoginInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username })
    if (!user) {
      return {
        errors: [
          {
            field: 'username',
            message: "that username doesn't exist.",
          },
        ],
      }
    }
    const valid = await argon2.verify(user.password, options.password)
    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password.',
          },
        ],
      }
    }
    req.session.userId = user.id
    return { user }
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    try {
      return new Promise((resolve) =>
        req.session.destroy((err) => {
          res.clearCookie(process.env.COOKIE_NAME!)
          if (err) {
            console.log(err)
            resolve(false)
            return
          }
          resolve(true)
        })
      )
    } catch (error) {
      throw error
    }
  }
}
