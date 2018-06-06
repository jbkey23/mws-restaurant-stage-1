const gulp = require('gulp');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');

gulp.task('default', ['scripts', 'styles'], function() {
    gulp.watch('js/**/*.js', ['scripts']);
    gulp.watch('css/**/*.css', ['styles']);
});

gulp.task('build-prod', ['scripts-prod', 'styles-prod']);

gulp.task('scripts', function() {
    return gulp.src('js/**/*.js')
            .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-prod', function() {
    return gulp.src('js/**/*.js')
            .pipe(babel({presets: ['env']}))
            .pipe(uglify())
            .pipe(gulp.dest('dist/js'));
});

gulp.task('styles', function() {
    return gulp.src('css/**/*.css')
            .pipe(gulp.dest('dist/css'));
});

gulp.task('styles-prod', function() {
    return gulp.src('css/**/*.css')
            .pipe(cleanCSS())
            .pipe(gulp.dest('dist/css'));
});