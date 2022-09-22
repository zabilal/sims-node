import { createTransport } from 'nodemailer';
import mailgun from 'mailgun-js';
import Logger from '../../config/logger.js';
import config from '../../config/config.js';
// create reusable transporter object using the default SMTP transport
const transport = createTransport(config.email.smtp);

// const DOMAIN = 'www.zaktech.ng';
// const mg = mailgun({ apiKey: '81633726753b7ebed306c4a12ff84d58-09001d55-2334f22b', domain: DOMAIN });
//
// if (config.env !== 'test') {
//   transport.verify((error) => {
//     if (error) {
//       Logger.warn(error);
//     } else {
//       Logger.info('Server is ready to take our messages');
//     }
//   });
// }

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  const msg = { from: config.email.from, to, subject, text };

  //nodemailer
  try {
    const message = await transport.send(msg);
    Logger.info(message);
  } catch (e) {
    Logger.error(e);
  }

  //mailgun
  // const data = {
  //   from: 'Excited User <me@samples.mailgun.org>',
  //   to: 'bar@example.com, YOU@YOUR_DOMAIN_NAME',
  //   subject: 'Hello',
  //   text: 'Testing some Mailgun awesomness!'
  // };
  // mg.messages().send(msg, function (error, body) {
  //   if (error) {
  //     Logger.error(error);
  //   }
  //   Logger.info(body);
  // });
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
  const text = `Dear user,
  To reset your password, click on this link: ${resetPasswordUrl}
  If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

export default {
  // transport,
  sendEmail,
  sendResetPasswordEmail,
};
