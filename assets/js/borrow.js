$(function () {
    Nav.render('borrow');

    const loggedIn = Api.isLoggedIn();
    if (!loggedIn) {
        $('#guest-fields, #guest-fields-2').removeClass('d-none');
        $('#guest_name, #guest_email').prop('required', true);
    } else {
        $('#history-card').show();
    }

    function statusBadge(status) {
        const map = { pending: 'warning', approved: 'success', rejected: 'danger' };
        return `<span class="badge bg-${map[status] || 'secondary'}">${status}</span>`;
    }

    function loadEquipment() {
        Api.get('/borrow/equipment').done((res) => {
            const list = $('#equipment-list').empty();
            const select = $('#equipment_id').empty();

            res.equipment.forEach((eq) => {
                list.append(`
                    <div class="d-flex justify-content-between align-items-center py-1 equipment-card ${eq.available ? '' : 'unavailable'}">
                        <span>${eq.code} <small class="text-muted">(${eq.category})</small></span>
                        ${eq.available
                            ? '<span class="badge bg-success">Available</span>'
                            : `<span class="badge bg-secondary">Free from ${eq.available_from || 'TBD'}</span>`}
                    </div>
                `);
                select.append(`<option value="${eq.id}" ${eq.available ? '' : 'disabled'}>${eq.code} — ${eq.category}${eq.available ? '' : ' (unavailable)'}</option>`);
            });
        }).fail((err) => showAlert('#alert-box', err));
    }

    function loadHistory() {
        if (!loggedIn) return;
        Api.get('/borrow/history').done((res) => {
            const tbody = $('#history-body').empty();
            if (!res.data.length) {
                tbody.html('<tr><td colspan="5" class="text-center text-muted py-3">No bookings yet.</td></tr>');
                return;
            }
            res.data.forEach((b) => {
                const canReturn = b.status === 'approved' && !b.actual_returned_at;
                tbody.append(`
                    <tr>
                        <td>${b.equipment ? b.equipment.code : '—'}</td>
                        <td>${b.borrow_date} → ${b.return_date}</td>
                        <td>${statusBadge(b.status)}</td>
                        <td>${b.actual_returned_at ? new Date(b.actual_returned_at).toLocaleDateString() : '—'}</td>
                        <td>${canReturn ? `<button class="btn btn-sm btn-outline-secondary return-btn" data-id="${b.id}">Mark returned</button>` : ''}</td>
                    </tr>
                `);
            });
        }).fail((err) => showAlert('#alert-box', err));
    }

    $('#history-body').on('click', '.return-btn', function () {
        const id = $(this).data('id');
        Api.post(`/borrow/${id}/return`).done((res) => {
            showAlert('#alert-box', res.message, 'success');
            loadHistory();
        }).fail((err) => showAlert('#alert-box', err));
    });

    $('#borrow-form').on('submit', function (e) {
        e.preventDefault();
        clearAlert('#alert-box');
        $('#submit-btn').prop('disabled', true).text('Submitting...');

        const payload = {
            equipment_id: $('#equipment_id').val(),
            borrow_date: $('#borrow_date').val(),
            return_date: $('#return_date').val(),
            reason: $('#reason').val() || null,
        };
        if (!loggedIn) {
            payload.guest_name = $('#guest_name').val();
            payload.guest_email = $('#guest_email').val();
        }

        Api.post('/borrow', payload).done((res) => {
            showAlert('#alert-box', res.message, 'success');
            $('#borrow-form')[0].reset();
            loadEquipment();
            loadHistory();
        }).fail((err) => {
            showAlert('#alert-box', err);
        }).always(() => {
            $('#submit-btn').prop('disabled', false).text('Submit booking');
        });
    });

    loadEquipment();
    loadHistory();
});
