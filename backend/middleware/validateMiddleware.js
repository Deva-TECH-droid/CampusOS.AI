// TODO: Request body validation middleware
const validate = (schema) => (req, res, next) => {
  next();
};
module.exports = { validate };
