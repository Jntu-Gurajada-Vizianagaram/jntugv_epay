module.exports = {
  apps: [
    {
      name: "jntugv-epay-backend",
      script: "./backend/server.js",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "jntugv-epay-frontend",
      script: "serve",
      env: {
        PM2_SERVE_PATH: "./frontend/dist",
        PM2_SERVE_PORT: 5173,
        PM2_SERVE_SPA: "true",
        PM2_SERVE_HOMEPAGE: "/index.html"
      }
    }
  ]
};
