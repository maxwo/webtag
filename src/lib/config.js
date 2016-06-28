import nconf from 'nconf';

const config = nconf
	.argv()
    .env()
    .file({
        file: '/etc/webtag/config.json',
    })
    .file({
        file: 'etc/defaults.json',
    });

export default config;
