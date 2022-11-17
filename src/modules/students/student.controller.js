import httpStatus from 'http-status';
import studentService from './student.service.js';
import catchAsync from '../../utils/catchAsync.js';
import pick from '../../utils/pick.js';
import ApiError from '../../utils/ApiError.js';

const createStudent = catchAsync(async (req, res) => {
  const student = await studentService.createStudent(req.body);
  res.status(httpStatus.CREATED).send(student);
});

const getAllStudents = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['schoolId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const allStudents = await studentService.getAllStudents(filter, options);
  res.status(httpStatus.OK).send(allStudents);
});

const getStudentById = catchAsync(async (req, res) => {
  const student = await studentService.getStudentById(req.params.studentId);
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }
  res.status(httpStatus.OK).send(student);
});

const updateStudent = catchAsync(async (req, res) => {
  const school = await studentService.updateStudentById(req.params.studentId, req.body);
  res.send(school);
});

export default {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
};
