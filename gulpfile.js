const gulp = require('gulp');
const sass = require('gulp-sass');
const cleanCSS = require('gulp-clean-css');

sass.compiler = require('node-sass');

gulp.task('sass', function () {
    return gulp.src('public/scss/main.scss')
        .pipe(sass())
        .pipe(cleanCSS())
        .pipe(gulp.dest('public/css'));
});

gulp.task('watch', function () {
    gulp.watch('public/scss/**/*.scss', gulp.parallel('sass'));
});