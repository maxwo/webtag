var nconf = require('nconf');

nconf.argv()
    .env()
    .file({
        file: './etc/config.json'
    })
    .file({
        file: './etc/defaultConfig.json'
    })
    .defaults({
	    elasticSearchHost: '192.168.1.5',
	    elasticSearchPort: 9200,
        elasticSearchIndex: 'webtag',

        localStoragePath: '/Users/max/files/',

        httpHost: '192.168.1.13',
        httpPort: 1227,

        amqpHost: '192.168.1.5',
        amqpPort: 5672,
        amqpEventsRate: 500,
        amqpEventsExchangeName: 'events',
        amqpEventsExchangeParameters: {
            durable: true,
            autoDelete: false
        }
	});

module.exports = nconf;
