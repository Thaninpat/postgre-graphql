import { RegisterInput } from '../resolvers/RegisterInput'
import { validateEmail, validateUsername, validatePassword } from './validate'

export const validateRegister = (options: RegisterInput) => {
  const isEmailValid = validateEmail(options.email)

  if (!isEmailValid) {
    return [
      {
        field: 'email',
        message: 'email is invalid.',
      },
    ]
  }

  const isUsernameValid = validateUsername(options.username)
  if (!isUsernameValid) {
    return [
      {
        field: 'username',
        message: 'length must be greater than 2 characters.',
      },
    ]
  }

  if (options.username.includes('@')) {
    return [
      {
        field: 'username',
        message: 'cannot include an @.',
      },
    ]
  }

  // const fmtEmail = options.email.trim().toLowerCase()
  // // console.log('Email', fmtEmail)
  // const checkEmail = await em.findOne(User, { email: fmtEmail })
  // if (checkEmail) {
  //   return {
  //     errors: [
  //       {
  //         field: 'email',
  //         message: 'email is already taken.',
  //       },
  //     ],
  //   }
  // }

  //   const checkUser = await em.findOne(User, { username: options.username })
  //   if (checkUser) {
  //     return {
  //       errors: [
  //         {
  //           field: 'username',
  //           message: 'username is already taken.',
  //         },
  //       ],
  //     }
  //   }

  const isPasswordValid = validatePassword(options.password)
  if (!isPasswordValid) {
    return [
      {
        field: 'password',
        message: 'length must be greater than 3 characters.',
      },
    ]
  }

  return null
}
