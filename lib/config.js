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
		elasticSearchHost: '127.0.0.1',
		elasticSearchPort: 9200,
		elasticSearchIndex: 'webtag',

		localStoragePath: '/Users/max/files/',

		httpHost: '127.0.0.1',
		httpPort: 1227,

		redisHost: '127.0.0.1',
		redisPort: 6379,

		amqpHost: '127.0.0.1',
		amqpPort: 5672,
		amqpEventsRate: 500,
		amqpEventsExchangeName: 'events',
		amqpEventsExchangeParameters: {
			durable: true,
			autoDelete: false
		}
	});

module.exports = nconf;
