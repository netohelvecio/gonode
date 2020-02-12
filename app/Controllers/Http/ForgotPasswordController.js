'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')
const crypto = require('crypto')
const Mail = use('Mail')
const isAfter = require('date-fns/isAfter')

class ForgotPasswordController {
  async store ({ request, response }) {
    try {
      const email = request.input('email')
      const user = await User.findByOrFail('email', email)

      user.token = crypto.randomBytes(10).toString('hex')
      user.token_created_at = new Date()

      await user.save()

      await Mail.send(
        ['emails.forgot_password'],
        {
          email,
          token: user.token,
          link: `${request.input('redirect_url')}?token=${user.token}`
        },
        message => {
          message
            .to(user.email)
            .from('noreply@gonode', 'Helvécio Neto')
            .subject('Recupereção de senha')
        }
      )
    } catch (error) {
      return response
        .status(error.status)
        .send({ error: { message: 'Email inexistente, verifique os dados!' } })
    }
  }

  async update ({ request, response }) {
    try {
      const { token, password } = request.all()

      const user = await User.findByOrFail('token', token)

      if (isAfter(user.token_created_at, new Date())) {
        return response
          .status(401)
          .send({ error: { message: 'Token de recuperação está expirado' } })
      }

      user.token = null
      user.token_created_at = null
      user.password = password

      await user.save()
    } catch (error) {
      return response
        .status(error.status)
        .send({ error: { message: 'Algo deu errado ao resetar sua senha!' } })
    }
  }
}

module.exports = ForgotPasswordController
