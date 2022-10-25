import mongoose from 'mongoose';
import validator from 'validator';
import toJSON from '../../plugins/toJSON.plugin.js';
import paginate from '../../plugins/paginate.plugin.js';

const studentModel = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    guardian: {
      type: String,
      required: false,
      trim: true,
    },
    dob: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: false,
      trim: true,
    },
    religion: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    class: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    group: {
      type: String,
      required: false,
      trim: true,
    },
    studentNo: {
      type: String,
      required: true,
      trim: true,
    },
    rollNo: {
      type: String,
      required: false,
      trim: true,
    },
    picture: {
      type: String,
      required: false,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    schoolId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);
studentModel.plugin(toJSON);
studentModel.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeStudentId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
studentModel.statics.isEmailTaken = async function (email, excludeStudentId) {
  const student = await this.findOne({ email, _id: { $ne: excludeStudentId } });
  return !!student;
};

const Student = mongoose.model('Students', studentModel);

export default Student;
