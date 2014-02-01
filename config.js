var nconf = require('nconf');

nconf.argv()
     .env()
     .file({ file: 'config.json' })
     .file({ file: 'defaultConfig.json' })
     .defaults({
	    elasticSearchHost: 'localhost',
	    elasticSearchPort: 9200,
        elasticSearchIndex: 'webtag',

        localStoragePath: '/Users/max/files/',

        httpHost: '192.168.1.10',
        httpPort: 1227
	});

module.exports = nconf;
