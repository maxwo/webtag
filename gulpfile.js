var gulp = require('gulp');
var eslint = require('gulp-eslint');

gulp.task('checkStyles', function() {
    return gulp.src(['src/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('default', ['checkStyles']);
