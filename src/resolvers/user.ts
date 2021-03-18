import { config } from 'dotenv'
config()
// import { randomBytes } from 'crypto'
import argon2 from 'argon2'
import { User } from '../entities/User'
import { MyContext, Role } from '../types'
import {
  Resolver,
  Mutation,
  Arg,
  Field,
  Ctx,
  // InputType,
  ObjectType,
  Query,
} from 'type-graphql'

// import {
//   validateEmail,
//   validatePassword,
//   validateUsername,
// } from '../utils/validate'

import Sendgrid, { MailDataRequired } from '@sendgrid/mail'
import { RegisterInput } from './RegisterInput'
import { validateRegister } from '../utils/validateRegister'
// import { sendEmail } from '../utils/sendEmail'
import { v4 } from 'uuid'

Sendgrid.setApiKey(process.env.SENDGRID_API_KEY!)

@ObjectType()
export class MessageResponse {
  @Field()
  message: string
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
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { em, req, redis }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: 'newPassword',
            message: 'length must be greater than 2',
          },
        ],
      }
    }
    const key = process.env.FORGET_PASSWORD_PREFIX + token
    const userId = await redis.get(key)
    if (!userId) {
      return {
        errors: [
          {
            field: 'token',
            message: 'token expired',
          },
        ],
      }
    }
    const user = await em.findOne(User, { id: parseInt(userId) })
    if (!user) {
      return {
        errors: [
          {
            field: 'token',
            message: 'user no longer exists',
          },
        ],
      }
    }
    await em.persistAndFlush(user)
    user.password = await argon2.hash(newPassword)

    await redis.del(key)
    // login user after change password
    req.session.userId = user.id
    return { user }
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { em, redis }: MyContext
  ) {
    const user = await em.findOne(User, { email })
    if (!user) {
      // The email is not in the database
      return true
    }
    const token = v4()
    await redis.set(
      process.env.FORGET_PASSWORD_PREFIX + token,
      user.id,
      'ex',
      1000 * 60 * 60 * 24 * 3
    ) // 3 day

    // await sendEmail(
    //   email,
    //   `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    // )

    const message: MailDataRequired = {
      from: 'ba_nk_zeed@hotmail.com',
      to: email,
      subject: 'Reset password',
      html: `
          <div>
            <p>Please click below link to reset your password.</p>
            <a href='http://localhost:3000/?resetToken=${token}' target='blank'>Click to reset password</a>
          </div>
        `,
    }
    const response = await Sendgrid.send(message)
    if (!response || response[0]?.statusCode !== 202) {
      throw new Error('Sorry, cannot proceed.')
    }

    return true
  }

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
      if (!req.session.userId) throw new Error('please log in to proceed.')

      const admin = await em.findOne(User, { id: req.session.userId })
      const isSuperAdmin = admin?.roles.includes(Role.SuperAdmin)
      if (!isSuperAdmin) throw new Error('not authorized.')

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
    const errors = validateRegister(options)
    if (errors) {
      return { errors }
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

    const hashedPassword = await argon2.hash(options.password)

    const user = await em.create(User, {
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
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,

    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(
      User,
      usernameOrEmail.includes('@')
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    )
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
    const valid = await argon2.verify(user.password, password)
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
      if (!req.session.userId) throw new Error('please log in to proceed.')

      const admin = await em.findOne(User, { id: req.session.userId })
      const isSuperAdmin = admin?.roles.includes(Role.SuperAdmin)
      if (!isSuperAdmin) throw new Error('not authorized.')

      const user = await em.findOne(User, { id })
      if (!user) throw new Error('user not found.')
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
