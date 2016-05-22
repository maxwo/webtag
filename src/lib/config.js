const nconf = require('nconf');

nconf
		.argv()
    .env()
    .file({
        file: '/etc/webtag/config.json',
    })
    .file({
        file: 'etc/defaults.json',
    });

module.exports = nconf;
