var nconf = require('nconf');

nconf.argv()
     .env()
     .file({ file: 'config.json' })
     .file({ file: 'defaultConfig.json' })
     .defaults({
	    elasticSearchHost: 'localhost',
	    elasticSearchPort: 9200,
        elasticSearchIndex: 'webtag',

        localStoragePath: '/home/max/files/',

        httpHost: '0.0.0.0',
        httpPort: 1227
	});

module.exports = nconf;
