var config = {}

config.elasticSearch = {
	host: process.env.ELASTICSEARCH_HOST || 'localhost',
	port: process.env.ELASTICSEARCH_PORT || 9200,
	index: 'webtag'
};

config.localStorage = {
	path: process.env.LOCALSTORAGE_PATH || '/Users/max/nodejs/data/'
};

config.web = {
	host: process.env.WEB_HOST || '0.0.0.0',
	port: process.env.WEB_PORT || 1227
};

module.exports = config;
