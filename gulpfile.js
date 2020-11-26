var gulp = require('gulp');
const $ = require('gulp-load-plugins')();
$.sass.compiler = require('node-sass');
var autoprefixer = require('autoprefixer');
var browserSync = require('browser-sync').create();
var minimist = require('minimist')

var envOption ={
    string:'env',
    default: {
        env: 'develop'
    }
}
var option = minimist(process.argv.slice(2),envOption);

gulp.task('clean', function () {
    return gulp.src('./public', {read: false,allowEmpty: true})
        .pipe($.clean());
});

gulp.task('jade', function() {
    return gulp.src('./source/**/*.jade')
        .pipe($.plumber())
        .pipe($.jade({
            pretty: true
    }))
        .pipe(gulp.dest('./public/'))
        .pipe(browserSync.stream())
    });

gulp.task('sass', function () {
    return gulp.src('./source/stylesheets/**/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass({
        outputStyle: 'nested',
        includePaths: ['./node_modules/bootstrap/scss']
    }).on('error', $.sass.logError))
    .pipe($.postcss([autoprefixer()]))
    .pipe($.if(option.env === 'production',$.cleanCss()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/stylesheet'))
    .pipe(browserSync.stream())
});

gulp.task('babel', () =>
    gulp.src('./source/js/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['@babel/env']
        }))
        .pipe($.concat('all.js'))
        .pipe($.if(option.env === 'production',$.uglify({
            compress:{
                drop_console: true,
            }
        })))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream())
);

gulp.task('vendorJS',function(){
    return gulp.src([
        './node_modules/jquery/dist/jquery.slim.min.js',
        './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
        ])
        .pipe($.concat('vendors.js'))
        .pipe($.if(option.env === 'production',$.uglify()))
        .pipe(gulp.dest('./public/js'))
});

gulp.task('image-min', ()=>
    gulp.src('./source/images/*')
    .pipe($.if(option.env === 'production',$.imagemin()))
    .pipe(gulp.dest('./public/images'))
)

gulp.task('default',
    gulp.series(
        'clean',
        'vendorJS',
        gulp.parallel('jade','sass','babel'),   
        function (done) {
            browserSync.init({
                server: {
                    baseDir: "./public",
                    reloadDebounce: 2000
                }
            });
            gulp.watch('./source/stylesheets/**/*.scss',gulp.series('sass'))
            gulp.watch('./source/**/*.jade',gulp.series('jade'))
            gulp.watch('./source/js/**/*.js',gulp.series('babel'))
            done();
        }
    )
)

gulp.task('build',
    gulp.series(
        'clean',
        'vendorJS',
        gulp.parallel('jade','sass','babel','image-min')
    )
)

gulp.task('deploy', function() {
    return gulp.src('./public/**/*')
    .pipe($.ghPages());
});