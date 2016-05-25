import nconf from 'nconf';

export const config = nconf
	.argv()
    .env()
    .file({
        file: '/etc/webtag/config.json',
    })
    .file({
        file: 'etc/defaults.json',
    });
