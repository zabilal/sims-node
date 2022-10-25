import httpStatus from 'http-status';
import schoolService from './school.service.js';
import catchAsync from '../../utils/catchAsync.js';
import pick from '../../utils/pick.js';
import ApiError from '../../utils/ApiError.js';
import Logger from '../../config/logger.js';

const createSchool = catchAsync(async (req, res) => {
  const school = await schoolService.createSchool(req.body);
  res.status(httpStatus.CREATED).send(school);
});

const getSchools = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await schoolService.getAllSchools(filter, options);
  res.status(httpStatus.OK).send(result);
});

const getOneSchoolById = catchAsync(async (req, res) => {
  const school = await schoolService.getSchoolById(req.params.id);
  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }
  res.send(school);
});

const getOneSchoolByTenantId = catchAsync(async (req, res) => {
  const school = await schoolService.getSchoolByTenantId(req.params.schoolId);
  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }
  res.send(school);
});

const getOneSchoolByEmail = catchAsync(async (req, res) => {
  const school = await schoolService.getSchoolByEmail(req.params.email);
  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }
  res.send(school);
});

const updateSchool = catchAsync(async (req, res) => {
  const school = await schoolService.updateSchoolById(req.params.schoolId, req.body);
  res.send(school);
});

const deleteSchool = catchAsync(async (req, res) => {
  await schoolService.deleteSchoolById(req.params.schoolId);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createSchool,
  getSchools,
  getOneSchoolById,
  getOneSchoolByTenantId,
  getOneSchoolByEmail,
  updateSchool,
  deleteSchool,
};
