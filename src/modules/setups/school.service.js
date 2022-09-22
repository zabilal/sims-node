import httpStatus from 'http-status';
import crypto from 'node:crypto';
import School from './school.model.js';
import userService from '../users/user.service.js';
import User from '../users/user.model.js';
import ApiError from '../../utils/ApiError.js';
import Roles from '../../config/roles.js';
import logger from '../../config/logger.js';
import emailService from '../email/email.service.js';

/**
 * Lets create a school
 * @param {Object} schoolBody
 * @returns {Promise<School>}
 */
const createSchool = async (schoolBody) => {
  if (await School.isEmailTaken(schoolBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School Email is already taken');
  }

  const school = new School();
  school.name = schoolBody.name;
  school.email = schoolBody.email;
  school.address = schoolBody.address;
  school.phone = schoolBody.phoneNumber;
  school.prePrimary = schoolBody.prePrimary;
  school.primary = schoolBody.primary;
  school.secondary = schoolBody.secondary;
  school.schoolId = crypto.randomUUID();

  const createdSchool = await School.create(school);
  // const createdSchool = await school.save();
  if (createdSchool != null) {
    const user = new User();
    user.firstName = schoolBody.firstName;
    user.lastName = schoolBody.lastName;
    user.email = schoolBody.adminEmail;
    user.password = schoolBody.password;
    user[1] = Roles.roles;
    user.schoolId = createdSchool.schoolId;

    const schoolAdmin = await userService.createUser(user);

    if (schoolAdmin == null) {
      School.findByIdAndDelete(createdSchool._id);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating schools');
    }

    createdSchool.admin = schoolAdmin;
    const emailResponse = await emailService.sendEmail(
      schoolAdmin.email,
      'SIMS Registration',
      'You have successfully registered your school, ' +
        'we welcome you onboard the future of education through technology. please kindly login and continue your setup.'
    );

    logger.info(`Email response ::: ${emailResponse}`);

    return createdSchool;
  }
};

export default {
  createSchool,
};
