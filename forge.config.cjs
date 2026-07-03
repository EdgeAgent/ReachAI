module.exports = {
  packagerConfig: {
    asar: true,
    name: 'ReachAI',
    executableName: 'reachai',
    icon: './assets/icon',
    appBundleId: 'com.reachai.app',
    appCategoryType: 'public.app-category.business',
    win32metadata: {
      CompanyName: 'Edge Agency',
      FileDescription: 'ReachAI - AI Outreach Automation',
      OriginalFilename: 'ReachAI.exe',
      ProductName: 'ReachAI',
      InternalName: 'ReachAI',
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'ReachAI',
        authors: 'Edge Agency',
        description: 'AI-powered outreach automation for modern businesses',
        setupIcon: './assets/icon.ico',
        noMsi: true,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32'],
    },
  ],
};