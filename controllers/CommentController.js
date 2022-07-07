import CommentModel from '../models/comment.js';

export const remove = async (req, res) => {
  try {
    const postId = req.params.id;

    CommentModel.findOneAndDelete(
      {
        _id: postId,
      },
      (err, doc) => {
        if (err) {
          console.log(error);
          res.status(500).json({
            message: 'Не удалось удалить статью',
          });
        }

        if (!doc) {
          return res.status(404).json({
            message: 'Статья не найдена',
          });
        }
        res.json({
          success: true,
        });
      },
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Не удалось получить статьи',
    });
  }
};

export const createComment = async (req, res) => {
  try {
    const doc = new CommentModel({
      user: req.userId,
      text: req.body.comments,
      postId: req.body.id,
    });

    const post = await doc.save();

    res.json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Не удалось создать статью',
    });
  }
};

export const getComment = async (req, res) => {
  try {
    const post = await CommentModel.find({ postId: req.id });

    const comments = await CommentMode.find({ post });

    res.json(comments);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Не удалось получить комментарии',
    });
  }
};
