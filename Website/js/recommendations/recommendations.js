'use strict';

var load = function (movies) {
        $.each(movies, function (i, movie) {
                if (!movie.poster || movie.poster == '' || movie.poster == 'N/A')
                        movie.poster = 'https://www.filmfodder.com/reviews/images/poster-not-available.jpg';

                $('body').append('<div class=\'rec\' style=\'display: inline-block;margin-left:20px;\'> <span style=\'display: block; font-size:20px;text-align:center; width: 280px;\'>' + movie.title + '</span><br> <img src=\'' + movie.poster + '\' style=\'height:250px;width:160px; margin-bottom:50px; margin-left:50px;\'></div>');
        });
};

$(document).ready(function () {
        console.log('System: Document ready');

        $.ajax({
                url: '/ajax-databricks',
                type: 'POST',
                timeout: 120000,
                success: function(response) {
                        response = JSON.parse(response)
                        //console.log('System:', response.status);
                        if (response.status) {
                                //console.log(response.movies);
                                $('#nav-bar a').css({ 'pointer-events': 'auto' });
                                $('#loading').css({ 'display': 'none' });
                                $('.rec-title').css({ 'display': 'block' });
                                load(response.movies);
                        } else {
                                console.log('System:', 'Databricks failed!');
                                window.location = '/?rate=Databricks+failed%21';
                        }
                },
                error: function(error) {
                        console.log('System error:', error);
                }
        });
});
