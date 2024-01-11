module.exports = {
    server: {
        port: process.env.PORT || 3000,
    },
    session: {
        secret: process.env.SESSION_SECRET || 'pepperoni',
    },
    database: {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'users',
        password: process.env.DB_PASSWORD || 'admin',
        port: process.env.DB_PORT || 5432,
    },
    bcrypt:{
        saltRounds: 10
    }
};