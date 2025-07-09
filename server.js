const app = require('./src/app');

const PORT = process.env.PORT || 3055;

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

process.on('SIGINT', () => {
    console.log('\n📡 Received SIGINT signal. Shutting down gracefully...');

    // Stop all jobs
    const jobManager = require('./src/jobs');
    jobManager.stop();

    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n📡 Received SIGTERM signal. Shutting down gracefully...');

    // Stop all jobs
    const jobManager = require('./src/jobs');
    jobManager.stop();

    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
