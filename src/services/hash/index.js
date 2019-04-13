import bcrypt from 'bcrypt'

export default async (password) => {
    const env = process.env.NODE_ENV || 'development'
    /* istanbul ignore next */
    const rounds = env === 'test' ? 1 : 9
    try {
      return await bcrypt.hash(password, rounds)
    } catch (err) {
      throw err
    }
  }
