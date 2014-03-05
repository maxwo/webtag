define('namespace', [], function() {

    console.log('Loading namespace');

    var WEBTAG = window.WEBTAG || {};

    WEBTAG.namespace = function() {
        var a=arguments, o=null, i, j, d;
        for (i=0; i<a .length; i=i+1) {
            d=a[i].split(".");
            o=WEBTAG;
            for (j=(d[0] == "WEBTAG") ? 1 : 0; j<d.length; j=j+1) {
                o[d[j]]=o[d[j]] || {};
                o=o[d[j]];
            }
        }

        return o;
    };

    return WEBTAG;

});