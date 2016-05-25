/* eslint-disable func-names,prefer-arrow-callback */

const gulp = require('gulp');
const eslint = require('gulp-eslint');

gulp.task('checkStyles', function () {
    return gulp.src(['src/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('default', ['checkStyles']);
