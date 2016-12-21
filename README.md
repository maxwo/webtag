webtag
======

A simple, distributed, tag-based, image archiver.

This project uses several components to archive images and any file:

*   NodeJS (or ioJS) as the web server. To ensure security, HTTPS is
    used, with client side certificate authentication;

*   User and group-based notification based on Socket.IO. Every file
    modification is notified in real-time to the end-users;

*   RESTful, making load balancing between several instances of the
    webservers easier;

*   RabbitMQ, to ensure communication between the different webserver instances;

*   Elasticsearch. You know, for search;

*   Redis as cache engine.

TODO
----

*   Create the storage workers that encrypt files and send them to an Amazon
    S3 or Glacier file storage.
