$(function () {
    Nav.requireAuth();
    Nav.render('profile');

    Api.get('/profile').done((user) => {
        $('#name').val(user.name);
        $('#email').val(user.email);
        Api.setCurrentUser(user);
    }).fail((err) => showAlert('#alert-box', err));

    $('#profile-form').on('submit', function (e) {
        e.preventDefault();
        clearAlert('#alert-box');
        $('#profile-btn').prop('disabled', true).text('Saving...');

        Api.put('/profile', { name: $('#name').val(), email: $('#email').val() })
            .done((res) => {
                Api.setCurrentUser(res.user);
                showAlert('#alert-box', res.message, 'success');
                Nav.render('profile');
            })
            .fail((err) => showAlert('#alert-box', err))
            .always(() => $('#profile-btn').prop('disabled', false).text('Save changes'));
    });

    $('#password-form').on('submit', function (e) {
        e.preventDefault();
        clearAlert('#alert-box');
        $('#password-btn').prop('disabled', true).text('Updating...');

        Api.put('/profile/password', {
            current_password: $('#current_password').val(),
            password: $('#password').val(),
            password_confirmation: $('#password_confirmation').val(),
        }).done((res) => {
            showAlert('#alert-box', res.message, 'success');
            $('#password-form')[0].reset();
        }).fail((err) => showAlert('#alert-box', err))
          .always(() => $('#password-btn').prop('disabled', false).text('Update password'));
    });

    $('#delete-form').on('submit', function (e) {
        e.preventDefault();
        if (!confirm('This will permanently delete your account. Continue?')) return;
        clearAlert('#alert-box');
        $('#delete-btn').prop('disabled', true).text('Deleting...');

        Api.del('/profile', { password: $('#delete_password').val() })
            .done(() => {
                Api.clearToken();
                window.location.href = 'index.html';
            })
            .fail((err) => {
                showAlert('#alert-box', err);
                $('#delete-btn').prop('disabled', false).text('Delete my account');
            });
    });
});
