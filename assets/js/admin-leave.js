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
        $('#leave-body').html('<tr><td colspan="6" class="text-center text-muted py-4">Loading...</td></tr>');
        Api.get(`/admin/leave?status=${status}&page=${page}`).done((res) => {
            const tbody = $('#leave-body').empty();
            if (!res.data.length) {
                tbody.html('<tr><td colspan="6" class="text-center text-muted py-4">No requests.</td></tr>');
            } else {
                res.data.forEach((l) => {
                    const requester = l.user ? l.user.name : `${l.guest_name} <span class="badge bg-info text-dark">guest</span>`;
                    const actions = l.status === 'pending'
                        ? `<button class="btn btn-sm btn-success approve-btn" data-id="${l.id}">Approve</button>
                           <button class="btn btn-sm btn-outline-danger reject-btn" data-id="${l.id}">Reject</button>`
                        : (l.reviewer ? `<span class="small text-muted">by ${l.reviewer.name}</span>` : '');

                    tbody.append(`
                        <tr>
                            <td>${requester}</td>
                            <td class="text-capitalize">${l.type}</td>
                            <td>${l.start_date} → ${l.end_date}</td>
                            <td>${l.reason || '—'}</td>
                            <td>${statusBadge(l.status)}</td>
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

    $('#leave-body').on('click', '.approve-btn', function () {
        const id = $(this).data('id');
        Api.post(`/admin/leave/${id}/approve`).done((res) => {
            showAlert('#alert-box', res.message, 'success');
            load();
        }).fail((err) => showAlert('#alert-box', err));
    });

    $('#leave-body').on('click', '.reject-btn', function () {
        const id = $(this).data('id');
        Api.post(`/admin/leave/${id}/reject`).done((res) => {
            showAlert('#alert-box', res.message, 'success');
            load();
        }).fail((err) => showAlert('#alert-box', err));
    });

    load();
});
