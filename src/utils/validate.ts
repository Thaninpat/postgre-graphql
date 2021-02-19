export const validateEmail = (email: string) => {
  const fmtEmail = email.trim().toLowerCase()

  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

  return emailRegex.test(fmtEmail)
}
