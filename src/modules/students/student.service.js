import httpStatus from 'http-status';
import Student from './student.model.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../config/logger.js';

const createStudent = async (studentRequest) => {
  if (await Student.isEmailTaken(studentRequest.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Student with same Email is already registered');
  }

  const student = new Student();
  const newStudent = Object.assign(student, studentRequest);

  return student.save(newStudent);
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
const getAllStudents = async (filter, options) => {
  return Student.paginate(filter, options);
};

/**
 * Get student by id
 * @param {ObjectId} studentId
 * @returns {Promise<Student>}
 */
const getStudentById = async (studentId) => {
  return Student.findById(studentId);
};

export default {
  createStudent,
  getAllStudents,
  getStudentById,
};
