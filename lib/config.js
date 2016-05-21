const nconf = require('nconf');

nconf
		.argv()
    .env()
    .file({
        file: 'etc/config.json',
    })
    .file({
        file: 'etc/defaults.json',
    });

module.exports = nconf;
