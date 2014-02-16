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

require(['jquery', 'socket.io'], function($, io) {

    var socket = io.connect('/');

    var progress = function(uuid) {
        return $('progress')
            .filter(function() {
                return $(this).data('uuid')===uuid;
            });
    };

    socket.on('uploadStart', function (data) {

        $('<progress/>')
            .addClass('upload')
            .data('uuid', data.uuid)
            .attr('max', data.expected)
            .attr('value', 0)
            .appendTo($('#notifications'));

    });

    socket.on('uploadProgress', function (data) {
        progress(data.uuid).attr('value', data.processed);
    });

    socket.on('uploadFinish', function (data) {
        progress(data.uuid).attr('value', data.processed);
    });

});