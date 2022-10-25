import mongoose from 'mongoose';
import validator from 'validator';
import toJSON from '../../plugins/toJSON.plugin.js';
import paginate from '../../plugins/paginate.plugin.js';

const schoolSchema = new mongoose.Schema(
  {
    name: {
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
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    preprimary: {
      type: String,
      // required: true,
      trim: true,
    },
    primary: {
      type: String,
      trim: true,
    },
    secondary: {
      type: String,
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

// add plugin that converts mongoose to json
schoolSchema.plugin(toJSON);
schoolSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeSchoolId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
schoolSchema.statics.isEmailTaken = async function (email, excludeSchoolId) {
  const school = await this.findOne({ email, _id: { $ne: excludeSchoolId } });
  return !!school;
};

const School = mongoose.model('School', schoolSchema);

export default School;
