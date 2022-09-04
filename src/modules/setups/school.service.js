// import httpStatus from 'http-status';
// import School from './school.model.js';
// import userService from '../users/user.service.js';
// import User from '../users/user.model.js';
// import ApiError from '../../utils/ApiError.js';

// /**
//  * Lets create a school
//  * @param {Object} schoolBody
//  * @returns {Promise<School>}
//  */
// const createSchool = async (schoolBody) => {
//   if (await School.isEmailTaken(schoolBody.email)) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
//   }

//   const user = User();
//   user.firstName = schoolBody.adminFirstName;
//   user.lastName = schoolBody.adminLastName;
//   user.email = schoolBody.adminEmail;
//   user.password = schoolBody.adminPassword;

// //   const school = await School.create();
// };
