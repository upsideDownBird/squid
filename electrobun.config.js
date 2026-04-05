export default {
  app: {
    name: 'squid',
    identifier: 'com.squid.desktop',
    version: '0.1.0'
  },
  build: {
    bun: {
      entrypoint: './src/bun/index.ts'
    },
    // macOS：默认读取项目根目录下的 icon.iconset/（见 Electrobun Application Icons 文档）
    win: {
      icon: 'icon.iconset/icon_256x256.png'
    },
    linux: {
      icon: 'icon.iconset/icon_256x256.png'
    }
  },
  views: {
    main: {
      entrypoint: './src/browser/index.html'
    }
  }
};
