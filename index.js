import express from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import multer from 'multer';
import cors from 'cors';

import { loginValidator, postCreateValidator, registerValidator } from './validations.js';

import UserModel from './models/user.js';

import checkAuth from './middleware/checkAuth.js';
import handleValidationErrors from './middleware/handleValidationErrors.js';

import * as PostController from './controllers/PostController.js';
import * as CommentController from './controllers/CommentController.js';

mongoose
  // .connect(process.env.MONGODB_URI)
  .connect(
    'mongodb://admin:wwwwww@cluster0-shard-00-00.ngjtw.mongodb.net:27017,cluster0-shard-00-01.ngjtw.mongodb.net:27017,cluster0-shard-00-02.ngjtw.mongodb.net:27017/blog?ssl=true&replicaSet=atlas-yqjhev-shard-0&authSource=admin&retryWrites=true&w=majority',
  )
  .then(() => console.log('DB okey'))
  .catch((err) => console.log('DB err', err));

const app = express();

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads');
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

app.post('/auth/login', loginValidator, handleValidationErrors, async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден',
      });
    }

    const isValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash);

    if (!isValidPass) {
      return res.status(400).json({
        message: 'Неверный логин или пароль',
      });
    }

    const token = jwt.sign(
      {
        _id: user._id,
      },
      'secret123',
      {
        expiresIn: '30d',
      },
    );

    const { passwordHash, ...userData } = user._doc;

    res.json({
      ...userData,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Не удалось авторизоваться',
    });
  }
});

app.post('/auth/register', registerValidator, handleValidationErrors, async (req, res) => {
  try {
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const doc = new UserModel({
      email: req.body.email,
      fullName: req.body.fullName,
      avatarUrl: req.body.avatarUrl,
      passwordHash: hash,
    });

    const user = await doc.save();

    const token = jwt.sign(
      {
        _id: user._id,
      },
      'secret123',
      {
        expiresIn: '30d',
      },
    );

    const { passwordHash, ...userData } = user._doc;

    res.json({
      ...userData,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Не удалось зарегистрироваться',
    });
  }
});

app.get('/auth/me', checkAuth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден',
      });
    }

    const { passwordHash, ...userData } = user._doc;

    res.json(userData);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Нет доступа',
    });
  }
});

app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
  res.json({
    url: `/uploads/${req.file.originalname}`,
  });
});

app.get('/tags', PostController.getLastTags);

app.get('/posts', PostController.getAll);
app.get('/posts/tags', PostController.getLastTags);
app.get('/posts/:id', PostController.getOne);
app.post('/posts', checkAuth, postCreateValidator, handleValidationErrors, PostController.create);
app.delete('/posts/:id', checkAuth, PostController.remove);
app.patch(
  '/posts/:id',
  checkAuth,
  postCreateValidator,
  handleValidationErrors,
  PostController.update,
);

app.post('/comment/add', checkAuth, PostController.createComment);

app.listen(process.env.PORT || 4444, (err) => {
  if (err) {
    return console.log('Error');
  }

  console.log('Server run');
});
