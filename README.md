webtag
======

A simple, distributed, tag-based, image & file archiver.

Technical presentation
----------------------

This project uses several components to archive image and any file :

![Technical schema](http://maxwo.github.io/images/webtag.png "Technical schema")

Webtag uses several technologies to process and store files :

*   NodeJS (or ioJS) as the web server. Note that to ensure security, HTTPS is
    used, with client side certificate authentication;

*   User and group-based notification based on Socket.IO. Every file
    modification is notified in real-time to the end-users;

*   Fully RESTful, stateless interface, making load balancing between 
    several instances of the webservers easier;

*   RabbitMQ, to ensure communication between the different webserver instances,
    allowing maximum scalability, as well as between webservers and OCR workers.

*   Elasticsearch, used as the main database of the project.

*   Redis as cache engine.
