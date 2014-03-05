define('notification', ['namespace', 'jquery', 'socket.io', 'underscore'], function(WEBTAG, $, io, _) {

    console.log('Loading notification');

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

    return WEBTAG;

});