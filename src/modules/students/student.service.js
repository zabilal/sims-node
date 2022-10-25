import httpStatus from 'http-status';
import crypto from 'node:crypto';
import Student from './student.model.js';
import userService from '../users/user.service.js';
import User from '../users/user.model.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../config/logger.js';

const createStudent = async (studentRequest) => {
  if (await Student.isEmailTaken(studentRequest.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Student with same Email is already registered');
  }

  const student = studentRequest;

  delete student.username;
  delete student.password;

  student.studentId = crypto.randomUUID();

  const newStudent = new Student();
  const createdStudent = await newStudent.save(student);

  return createdStudent;
};

const getAllStudents = async (filter, options) => {
  return Student.paginate(filter, options);
};

export default {
  createStudent,
  getAllStudents,
};
