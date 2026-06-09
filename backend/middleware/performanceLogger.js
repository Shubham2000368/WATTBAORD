const performanceLogger = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const time = diff[0] * 1e3 + diff[1] * 1e-6; // Convert to milliseconds
    
    // Log if response takes more than 500ms
    if (time > 500) {
      console.warn(`[Performance] SLOW REQUEST: ${req.method} ${req.originalUrl} - ${time.toFixed(2)}ms`);
    } else if (process.env.NODE_ENV !== 'production') {
      // In dev, log all times briefly
      console.log(`[Performance] ${req.method} ${req.originalUrl} - ${time.toFixed(2)}ms`);
    }
  });

  next();
};

module.exports = performanceLogger;
