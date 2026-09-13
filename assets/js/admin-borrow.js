$(function () {
    Nav.requireAdmin();
    Nav.render('admin', '../');

    let status = 'pending';
    let page = 1;

    function statusBadge(s) {
        const map = { pending: 'warning', approved: 'success', rejected: 'danger' };
        return `<span class="badge bg-${map[s] || 'secondary'}">${s}</span>`;
    }

    function load() {
        $('#borrow-body').html('<tr><td colspan="7" class="text-center text-muted py-4">Loading...</td></tr>');
        Api.get(`/admin/borrow?status=${status}&page=${page}`).done((res) => {
            const tbody = $('#borrow-body').empty();
            if (!res.data.length) {
                tbody.html('<tr><td colspan="7" class="text-center text-muted py-4">No bookings.</td></tr>');
            } else {
                res.data.forEach((b) => {
                    const requester = b.user ? b.user.name : `${b.guest_name} <span class="badge bg-info text-dark">guest</span>`;
                    let actions = '';
                    if (b.status === 'pending') {
                        actions = `<button class="btn btn-sm btn-success approve-btn" data-id="${b.id}">Approve</button>
                                   <button class="btn btn-sm btn-outline-danger reject-btn" data-id="${b.id}">Reject</button>`;
                    } else if (b.status === 'approved' && !b.actual_returned_at) {
                        actions = `<button class="btn btn-sm btn-outline-secondary return-btn" data-id="${b.id}">Mark returned</button>`;
                    }

                    tbody.append(`
                        <tr>
                            <td>${requester}</td>
                            <td>${b.equipment ? b.equipment.code : '—'}</td>
                            <td>${b.borrow_date} → ${b.return_date}</td>
                            <td>${b.reason || '—'}</td>
                            <td>${statusBadge(b.status)}</td>
                            <td>${b.actual_returned_at ? new Date(b.actual_returned_at).toLocaleDateString() : '—'}</td>
                            <td class="text-nowrap">${actions}</td>
                        </tr>
                    `);
                });
            }

            const pag = $('#pagination').empty();
            for (let p = 1; p <= res.last_page; p++) {
                pag.append(`<li class="page-item ${p === res.current_page ? 'active' : ''}"><a class="page-link" href="#" data-page="${p}">${p}</a></li>`);
            }
        }).fail((err) => showAlert('#alert-box', err));
    }

    $('#status-filter button').on('click', function () {
        $('#status-filter button').removeClass('active');
        $(this).addClass('active');
        status = $(this).data('status');
        page = 1;
        load();
    });

    $('#pagination').on('click', 'a.page-link', function (e) {
        e.preventDefault();
        page = parseInt($(this).data('page'), 10);
        load();
    });

    $('#borrow-body').on('click', '.approve-btn', function () {
        Api.post(`/admin/borrow/${$(this).data('id')}/approve`).done((res) => {
            showAlert('#alert-box', res.message, 'success');
            load();
        }).fail((err) => showAlert('#alert-box', err));
    });

    $('#borrow-body').on('click', '.reject-btn', function () {
        Api.post(`/admin/borrow/${$(this).data('id')}/reject`).done((res) => {
            showAlert('#alert-box', res.message, 'success');
            load();
        }).fail((err) => showAlert('#alert-box', err));
    });

    $('#borrow-body').on('click', '.return-btn', function () {
        Api.post(`/admin/borrow/${$(this).data('id')}/return`).done((res) => {
            showAlert('#alert-box', res.message, 'success');
            load();
        }).fail((err) => showAlert('#alert-box', err));
    });

    load();
});
