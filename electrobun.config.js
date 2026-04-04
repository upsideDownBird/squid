export default {
  app: {
    name: 'Jobopx Desktop',
    identifier: 'com.jobopx.desktop',
    version: '0.1.0'
  },
  build: {
    bun: {
      entrypoint: './src/bun/index.ts'
    }
  },
  views: {
    main: {
      entrypoint: './src/browser/index.html'
    }
  }
};
