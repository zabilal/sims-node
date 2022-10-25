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

  const newSchool = Object.assign(school, schoolBody);
  newSchool.schoolId = crypto.randomUUID();
  const createdSchool = await school.save(newSchool);

  if (createdSchool != null) {
    const user = new User();

    const newUser = Object.assign(user, schoolBody);
    newUser.role = Roles.roles[1];
    newUser.schoolId = createdSchool.schoolId;

    const schoolAdmin = await userService.createUser(newUser);

    if (schoolAdmin == null) {
      School.findOneAndRemove(createdSchool.id);
      throw new ApiError(httpStatus.BAD_REQUEST, 'Error creating schools');
    }

    // school created, send a welcome email
    await emailService.sendEmail(
      school.name,
      schoolAdmin.email,
      'Welcome onboard SIMS',
      '<html><head></head><body><p>Hello,</p>we welcome you onboard the future of education through technology. please kindly login and continue your setup.</p></body></html>'
    );
    const response = { school: createdSchool, admin: schoolAdmin };

    logger.info(`NEW SCHOOL CREATED :: ${response}`);

    return response;
  }
};

/**
 * Get school by id
 * @param {ObjectId} id
 * @returns {Promise<School>}
 */
const getSchoolById = async (schoolId) => {
  return School.findById(schoolId);
};

/**
 * Get school by tenant id
 * @param {ObjectId} id
 * @returns {Promise<School>}
 */
const getSchoolByTenantId = async (tenantId) => {
  return School.findOne({ schoolId: tenantId });
};

/**
 * Query for schools
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const getAllSchools = async (filter, options) => {
  return School.paginate(filter, options);
};

/**
 * Get school by email
 * @param {string} email
 * @returns {Promise<School>}
 */
const getSchoolByEmail = async (email) => {
  return School.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} schoolId
 * @param {Object} updateBody
 * @returns {Promise<School>}
 */
const updateSchoolById = async (schoolId, updateBody) => {
  const school = await getSchoolById(schoolId);
  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }
  if (updateBody.email && (await School.isEmailTaken(updateBody.email, schoolId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(school, updateBody);
  await school.save();
  return school;
};

/**
 * Delete user by id
 * @param {ObjectId} schoolId
 * @returns {Promise<User>}
 */
const deleteSchoolById = async (schoolId) => {
  const school = await getSchoolById(schoolId);
  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }
  await school.remove();
  return school;
};

export default {
  createSchool,
  getSchoolById,
  getSchoolByTenantId,
  getAllSchools,
  getSchoolByEmail,
  updateSchoolById,
  deleteSchoolById,
};
