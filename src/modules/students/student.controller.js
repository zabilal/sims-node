import httpStatus from 'http-status';
import studentService from './student.service.js';
import catchAsync from '../../utils/catchAsync.js';
import pick from '../../utils/pick.js';
import ApiError from '../../utils/ApiError.js';
import Logger from '../../config/logger.js';
import schoolService from '../settings/school.service.js';

const createStudent = catchAsync(async (req, res) => {
  const student = await schoolService.createSchool(req.body);
  res.status(httpStatus.CREATED).send(student);
});

const getAllStudents = catchAsync(async (req, res) => {
  const allStudents = await studentService.getAllStudents();
  res.status(httpStatus.OK).send(allStudents);
});

export default {
  createStudent,
  getAllStudents,
};
