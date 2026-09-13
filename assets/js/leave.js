$(function () {
    Nav.requireAuth();
    Nav.render('leave');

    function statusBadge(status) {
        const map = { pending: 'warning', approved: 'success', rejected: 'danger' };
        return `<span class="badge bg-${map[status] || 'secondary'}">${status}</span>`;
    }

    function load() {
        Api.get('/leave').done((res) => {
            const tbody = $('#leave-body');
            if (!res.data.length) {
                tbody.html('<tr><td colspan="5" class="text-center text-muted py-4">No leave requests yet.</td></tr>');
                return;
            }
            tbody.empty();
            res.data.forEach((l) => {
                tbody.append(`
                    <tr>
                        <td class="text-capitalize">${l.type}</td>
                        <td>${l.start_date} → ${l.end_date}</td>
                        <td>${Math.round((new Date(l.end_date) - new Date(l.start_date)) / 86400000) + 1}</td>
                        <td>${l.reason || '—'}</td>
                        <td>${statusBadge(l.status)}</td>
                    </tr>
                `);
            });
        }).fail((err) => showAlert('#alert-box', err));
    }

    $('#leave-form').on('submit', function (e) {
        e.preventDefault();
        clearAlert('#alert-box');
        $('#submit-btn').prop('disabled', true).text('Submitting...');

        Api.post('/leave', {
            type: $('#type').val(),
            start_date: $('#start_date').val(),
            end_date: $('#end_date').val(),
            reason: $('#reason').val() || null,
        }).done((res) => {
            showAlert('#alert-box', res.message, 'success');
            $('#leave-form')[0].reset();
            load();
        }).fail((err) => {
            showAlert('#alert-box', err);
        }).always(() => {
            $('#submit-btn').prop('disabled', false).text('Submit request');
        });
    });

    load();
});
