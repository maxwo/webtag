define('models', ['namespace', 'backbone', 'underscore'], function(WEBTAG, Backbone, _) {

    console.log('Loading models');

    WEBTAG.namespace("models");

    WEBTAG.models.Inode = Backbone.Model.extend({
        urlRoot: '/inode/'
    });

    WEBTAG.models.Tag = Backbone.Model.extend({
        urlRoot: '/tags/',
        idAttribute: 'tag'
    });


    WEBTAG.models.InodeCollection = Backbone.Collection.extend({
        url: function () {
            var url = "/tags";
            if ( this.tags ) {
                url += this.tags.join('/');
            }
            url += "/";
            if ( this.page ) {
                url += "?page="+ this.page;
            }
            return url;
        },
        initialize: function(options) {
            options = _.extend({tags: []}, options);
            this.tags = options.tags;
        },
        model: WEBTAG.models.Inode,
        parse: function(response) {
            return response.inodes;
        }
    });

    WEBTAG.models.TagCollection = Backbone.Collection.extend({
        url: function () {
            return '/tags/' + this.tags.join('/');
        },
        initialize: function(options) {
            options = _.extend({tags: []}, options);
            this.tags = options.tags;
        },
        model: WEBTAG.models.Tag,
        parse: function(response) {
            return response.tags;
        }
    });

    return WEBTAG;

});