'use strict';

var gSession = false, fSession = false;

// ALL
$(document).ready(function() {
        $('#endSession').click(function () {
                console.log('System:', 'Logging out.');

                if (gSession) logoutGoogle();
                if (fSession) logoutFacebook();

                window.location = '/logout';
        });
});

// GOOGLE
function checkGoogleSession() {
        console.log('Google:', 'Checking session.');

        gapi.load('auth2', function () {
                gapi.auth2.init({
                        //scope: 'additional_scope'
                }).then(function (auth2) {
                        if (auth2.isSignedIn.get()) {
                                console.log('Google:', 'User logged in.');
                                gSession = true;
                        } else {
                                console.log('Google:', 'User logged out.');
                        }
                });
        });
}
function logoutGoogle() {
        var auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(function () {
                console.log('Google:', 'User logged out.');
                gSession = false;
        });
}

// FACEBOOK
function checkFacebookSession(response) {
        if (response.status === 'connected') {
                console.log('Facebook:', 'User logged in.');
                fSession = true;
        } else {
                console.log('Facebook:', 'User logged out.');
        }
}
function logoutFacebook() {
        FB.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                        FB.logout(function (response) {
                                console.log('Facebook:', 'User logged out.');
                                fSession = false;
                        });
                }
        });
}
