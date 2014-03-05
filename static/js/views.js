define('views', ['namespace', 'backbone', 'underscore', 'jquery'], function(WEBTAG, Backbone, _, $) {

    console.log('Loading views');

    WEBTAG.namespace("views");

    WEBTAG.views.InodeItemListing = Backbone.View.extend({

        tagName: 'tr',

        initialize: function(){

            // Ensure our methods keep the `this` reference to the view itself
            _.bindAll(this, 'render');

            // If the model changes we need to re-render
            this.model.bind('change', this.render);

            this.template = _.template(
                $("#listingBitInodes").html()
            );

        },
        render: function(){

            $(this.el)
                .empty()
                .append(this.template({
                    inode: this.model
                }));

            return this;

        }
    });

    WEBTAG.views.InodeListing = Backbone.View.extend({

        // The collection will be kept here
        collection: null,

        initialize: function(options) {
            this.collection = options.collection;
            this.listenTo(this.collection, "reset", this.reset);
            this.listenTo(this.collection, "change", this.render);
            this.listenTo(this.collection, "add", this.render);
            this.listenTo(this.collection, "remove", this.render);
            /*
            // Ensure our methods keep the `this` reference to the view itself
            _.bindAll(this, 'render');

            // Bind collection changes to re-rendering
            this.collection.bind('reset', this.render);
            this.collection.bind('add', this.render);
            this.collection.bind('remove', this.render);*/

            this.template = _.template(
                $("#listingInodes").html()
            );

            this.reset();
        },

        reset: function() {

            $(this.el)
                .empty()
                .append(this.template());

        },

        render: function(inode) {

            console.log('Inode listing element: '+ $(this.el));

            var elementTBody = $(this.el).find('tbody');

            // Instantiate a PeopleItem view for each
            var itemView = new WEBTAG.views.InodeItemListing({
                model: inode
            });

            // Render the PeopleView, and append its element
            // to the table
            elementTBody.append(itemView.render().el);

            // Go through the collection items
            /*this.collection.forEach(function(item) {

                // Instantiate a PeopleItem view for each
                var itemView = new WEBTAG.views.InodeItemListing({
                    model: item
                });

                // Render the PeopleView, and append its element
                // to the table
                elementTBody.append(itemView.render().el);
            });*/

            return this;
        }
    });






    WEBTAG.views.TagItem = Backbone.View.extend({

        tagName: 'div',

        initialize: function(){

            // Ensure our methods keep the `this` reference to the view itself
            _.bindAll(this, 'render');

            // If the model changes we need to re-render
            this.model.bind('change', this.render);

        },
        render: function(){

            $(this.el)
                .append($('<a/>')
                    .attr('href', this.model.id)
                    .text(this.model.id));

            return this;

        },
        events: {
            "click a": "tagNavigation"
        },
        tagNavigation: function(e) {
            console.log('tagNavigation');
            e.preventDefault();
            $(this).trigger('navigate', this.model);
        }
    });

    WEBTAG.views.TagView = Backbone.View.extend({

        collection: null,

        initialize: function(options) {
            this.collection = options.collection;

            // Ensure our methods keep the `this` reference to the view itself
            _.bindAll(this, 'render');

            // Bind collection changes to re-rendering
            this.collection.bind('reset', this.render);
            this.collection.bind('add', this.render);
            this.collection.bind('remove', this.render);
        },

        render: function() {

            var that = this;
            var element = $(this.el).empty();

            console.log('Tag element: '+ element);

            // Go through the collection items
            this.collection.forEach(function(item) {

                // Instantiate a PeopleItem view for each
                var bit = new WEBTAG.views.TagItem({
                    model: item
                });

                // Render the PeopleView, and append its element
                // to the table
                element.append(bit.render().el);

                $(bit).on('navigate', function(event, tag) {
                    $(that).trigger('navigate', [that, tag]);
                });
            });

            return this;
        }
    });

    return WEBTAG;

});