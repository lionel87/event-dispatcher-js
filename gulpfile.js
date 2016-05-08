var gulp = require('gulp'),
    watch = require('gulp-watch'),
    minify = require('gulp-minify'),
    plumber = require('gulp-plumber'),
    nunjucksGulp = require('gulp-nunjucks');
    nunjucks = require('nunjucks'),
    fs = require('fs');

gulp.task('default', ['dist', 'compress']);

gulp.task('watch', ['dist', 'compress'], function()
{
    watch('src/platform/*.js', ['dist', 'compress']);
});

gulp.task('dist', function()
{
    var opts = {
            noCache: true
        },
        env = new nunjucks.Environment(new nunjucks.FileSystemLoader('src'), opts),
        context = {
            "package": JSON.parse(fs.readFileSync('package.json', 'utf8'))
        };
    
    gulp.src('src/platform/*.js')
        .pipe(plumber())
        .pipe(nunjucksGulp.compile(context, {env: env}))
        .pipe(gulp.dest('dist'));
});

gulp.task('compress', function() {
    gulp.src('dist/*-browser.js')
        .pipe(minify({
            preserveComments: 'some',
            ext: {
                src:'.js',
                min:'.min.js'
            }
        }))
        .pipe(gulp.dest('dist'));
});
