import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',timeout:30000,workers:1,
  use:{baseURL:'http://127.0.0.1:8765',serviceWorkers:'block'},
  webServer:{command:'python3 -m http.server 8765 --bind 127.0.0.1',url:'http://127.0.0.1:8765',reuseExistingServer:false},
  reporter:[['list'],['html',{open:'never'}]],
});
