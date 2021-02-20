import argon2 from 'argon2'
import { User } from '../entities/User'
import { MyContext, Role } from '../types'
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

import {
  validateEmail,
  validatePassword,
  validateUsername,
} from '../utils/validate'

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

  @Query(() => [User])
  async users(@Ctx() { em, req }: MyContext): Promise<User[]> {
    try {
      if (!req.session.userId) throw new Error('Please log in to proceed.')

      const admin = await em.findOne(User, { id: req.session.userId })
      const isSuperAdmin = admin?.roles.includes(Role.SuperAdmin)
      if (!isSuperAdmin) throw new Error('Not authorized.')

      return em.find(User, {})
    } catch (error) {
      throw error
    }
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
            message: 'email is invalid.',
          },
        ],
      }
    }

    const fmtEmail = options.email.trim().toLowerCase()
    // console.log('Email', fmtEmail)
    const checkEmail = await em.findOne(User, { email: fmtEmail })
    if (checkEmail) {
      return {
        errors: [
          {
            field: 'email',
            message: 'email is already taken.',
          },
        ],
      }
    }

    const isUsernameValid = validateUsername(options.username)
    if (!isUsernameValid) {
      return {
        errors: [
          {
            field: 'username',
            message: 'length must be greater than 2 characters.',
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
    const isPasswordValid = validatePassword(options.password)
    if (!isPasswordValid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'length must be greater than 3 characters.',
          },
        ],
      }
    }
    const hashedPassword = await argon2.hash(options.password)

    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
      email: fmtEmail,
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

  @Mutation(() => Boolean)
  async deleteUser(
    @Arg('id') id: number,
    @Ctx() { em }: MyContext
  ): Promise<Boolean> {
    await em.nativeDelete(User, { id })
    return true
  }

  @Mutation(() => User, { nullable: true })
  async updateRoles(
    @Arg('newRoles', () => [String]) newRoles: Role[],
    @Arg('id') id: number,
    @Ctx() { em, req }: MyContext
  ): Promise<User | null> {
    try {
      if (!req.session.userId) throw new Error('Please log in to proceed.')

      const admin = await em.findOne(User, { id: req.session.userId })
      const isSuperAdmin = admin?.roles.includes(Role.SuperAdmin)
      if (!isSuperAdmin) throw new Error('Not authorized.')

      const user = await em.findOne(User, { id })
      if (!user) throw new Error('User not found.')
      // Update roles
      if (!newRoles.includes(Role.Client)) {
        user.roles = [...newRoles, Role.Client]
      } else {
        user.roles = newRoles
      }
      await em.persistAndFlush(user)
      return user
    } catch (error) {
      throw error
    }
  }
}
