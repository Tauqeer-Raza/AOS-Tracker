export const sendError = (res, error, fallbackMessage = "Something went wrong") => {
  const status = error.statusCode || 500;
  return res.status(status).json({
    message: error.message || fallbackMessage,
  });
};
