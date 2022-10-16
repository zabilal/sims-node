// import { createTransport } from 'nodemailer';
import axios from 'axios';
import Logger from '../../config/logger.js';
import config from '../../config/config.js';

// const transport = createTransport(config.email.smtp);

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
 * @param {string} name
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (name, to, subject, text) => {

  // --------------nodemailer
  // const msg = { from: config.email.from, to, subject, text };
  // try {
  //   const message = await transport.send(msg);
  //   Logger.info(message);
  // } catch (e) {
  //   Logger.error(e);
  // }

  // ----------SendInBlue
  const data = JSON.stringify({
    sender: {
      name: config.email.name,
      email: config.email.from,
    },
    to: [
      {
        email: to,
        name,
      },
    ],
    subject,
    htmlContent: text,
  });

  const emailConfig = {
    method: 'post',
    url: 'https://api.sendinblue.com/v3/smtp/email',
    headers: {
      accept: 'application/json',
      'api-key': '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',
      'content-type': 'application/json',
    },
    data,
  };

  axios(emailConfig)
    .then(function (response) {
      Logger.info(JSON.stringify(response.data));
    })
    .catch(function (error) {
      Logger.error(error);
    });
};

/**
 * Send reset password email
 * @param {string} name
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (name, to, token) => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
  const text = `Dear user,
  To reset your password, click on this link: ${resetPasswordUrl}
  If you did not request any password resets, then ignore this email.`;
  await sendEmail(name, to, subject, text);
};

export default {
  // transport,
  sendEmail,
  sendResetPasswordEmail,
};
