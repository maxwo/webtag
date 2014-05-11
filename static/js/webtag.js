/**
 * Created by max on 09/02/2014.
 */
requirejs.config({

    paths: {
        'jquery': '/js/lib/jquery-2.1.0',
        'socket.io': '/js/lib/socket.io',
        'backbone': '/js/lib/backbone-1.1.1',
        'underscore': '/js/lib/underscore-1.6.0'
    },

    shim: {
        'backbone': [
            'underscore',
            'jquery'
        ]
    }

});

require(['jquery', 'backbone', 'underscore', 'models', 'views', 'notification'], function($, Backbone, _, WEBTAG) {

    var inodes = new WEBTAG.models.InodeCollection({tags: []});
    var tags = new WEBTAG.models.TagCollection({tags: []});
    var mainTags = new WEBTAG.models.TagCollection({tags: []});

    mainTags.fetch();
    inodes.fetch();
    tags.fetch();

    var inodeView = new WEBTAG.views.InodeListing({
        el: $("#listing"),
        collection: inodes
    });

    var tagView = new WEBTAG.views.TagView({
        el: $("#tagsView"),
        collection: tags
    });

    var mainTagView = new WEBTAG.views.TagView({
        el: $("#mainTagsView"),
        collection: mainTags
    });

    $(mainTagView).on('navigate', function(event, listView, tag) {

        inodeView.collection.tags = [tag.id];
        inodeView.collection.fetch();

        tagView.collection.tags = [tag.id];
        tagView.collection.fetch();

    });

    $(tagView).on('navigate', function(event, listView, tag) {

        inodeView.collection.tags.push(tag.id);
        inodeView.collection.fetch();

        tagView.collection.tags.push(tag.id);
        tagView.collection.fetch();

    });

    console.log(inodeView);
    $(inodeView).on('delete', function(e, inode) {


        inode.destroy();

    });

});