

function AppErrorHandler(err, req, res, next) {
  res.status(err.status || 500);
  const error = err?.message;
  res.json(error);
}

export { AppErrorHandler };
