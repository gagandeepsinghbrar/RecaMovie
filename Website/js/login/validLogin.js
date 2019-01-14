'use strict';

$(document).ready(function () {
        var cstyle = { 'border-color': 'rgba(255, 45, 45, .8)', 'border-width': '0px 0px 2px 0px' };

        $('#email').on('input', function() {
                var input = $(this).val();
                var pattern = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i
                if (input.length > 50 || input.length < 7 || !pattern.test(input))
                        $(this).css(cstyle);
                else
                        if ($(this).attr('style') !== undefined)
                                $(this).removeAttr('style');
        });

        $('#password').on('input', function() {
                var input = $(this).val();
                if (input.length > 100 || input.length < 8)
                        $(this).css(cstyle);
                else
                        if ($(this).attr('style') !== undefined)
                                $(this).removeAttr('style');
        });
});
