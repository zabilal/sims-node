import Mongoose from 'mongoose';
import Validator from 'validator';
import Bcrypt from 'bcryptjs';
import toJSON from '../../plugins/toJSON.plugin.js';
import paginate from '../../plugins/paginate.plugin.js';
import Roles from '../../config/roles.js';

const userSchema = new Mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First Name is required!'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last Name is required!'],
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!Validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    role: {
      type: String,
      enum: Roles.roles,
      default: 'user',
    },
    schoolId: {
      type: String,
      required: true,
      trim: true,
    },
    // favorites: {
    //   posts: [
    //     {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: 'Post',
    //     },
    //   ],
    // },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return Bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await Bcrypt.hash(user.password, 8);
  }
  next();
});

/**
 * @typedef User
 */
const User = Mongoose.model('User', userSchema);

export default User;
