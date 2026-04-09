console.log('Starting execution...');
const gplay = require('google-play-scraper');

gplay.search({term: 'cashe', num: 1})
  .then(res => {
    console.log('Search Results:', res);
    if(res.length > 0) {
      return gplay.permissions({appId: res[0].appId}).then(perms => console.log('Permissions fetch success, count:', perms.length));
    }
  })
  .catch(err => {
    console.error('Error during execution:', err);
  });
console.log('Setup complete, waiting for promises to resolve...');
