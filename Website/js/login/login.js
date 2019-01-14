'use strict';

// REGISTER
$(document).ready(function () {
        $('#register').click(function () {
                window.location = '/register';
        });
});

function loginSession(id, email, firstname, lastname) {
        $.ajax({
                url: '/ajax-api-session',
                data: {
                        id: id,
                        email: email,
                        firstname: firstname,
                        lastname: lastname
                },
                type: 'POST',
                success: function(response) {
                        response = JSON.parse(response)
                        //console.log('System:', response.status);
                        if (response.status) {
                                if (response.status == 2) window.location = '/';
                                else window.location = '/rate?msg=Logged+in+successfully%21';
                        } else {
                                console.log('System:', 'API login failed!');
                                window.location = '/?msg=Connection+failed%21';
                        }
                },
                error: function(error) {
                        console.log('System:', error);
                }
        });
}

// GOOGLE
function checkGoogleSession() {
        console.log('Google:', 'Checking session.');

        gapi.load('auth2', function () {
                gapi.auth2.init({
                        //scope: 'additional_scope'
                }).then(function (auth2) {
                        if (auth2.isSignedIn.get()) {
                                console.log('Google:', 'User logged in.');
                                var profile = auth2.currentUser.get().getBasicProfile();
                                loginSession(profile.getId(), profile.getEmail(), profile.getGivenName(), profile.getFamilyName());
                        } else {
                                console.log('Google:', 'User logged out.');

                                auth2.attachClickHandler(document.getElementById('g-login'), {}, function (googleUser) {
                                        console.log('Google:', 'User logged in.');
                                        var profile = googleUser.getBasicProfile();
                                        loginSession(profile.getId(), profile.getEmail(), profile.getGivenName(), profile.getFamilyName());
                                }, function (error) {
                                        console.log('Google:', JSON.stringify(error, undefined, 2));
                                });
                        }
                });
        });
}

// FACEBOOK
function checkFacebookSession(response) {
        if (response.status === 'connected') {
                console.log('Facebook:', 'User logged in.');
                FB.api('/me', 'GET', { 'fields': 'id, email, first_name, last_name' }, function (response) {
                        //var profile = JSON.parse(response);
                        loginSession(response.id, response.email, response.first_name, response.last_name);
                });
        } else {
                console.log('Facebook:', 'User logged out.');
        }
}
$(document).ready(function () {
        $('#f-login').click(function () {
                FB.login(function (response) {
                        checkFacebookSession(response);
                }, { scope: 'public_profile, email' });
        });
});
