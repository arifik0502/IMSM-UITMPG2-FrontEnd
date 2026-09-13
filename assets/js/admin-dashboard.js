$(function () {
    Nav.requireAdmin();
    Nav.render('admin', '../');

    function statCard(label, value, color) {
        return `
            <div class="col-md-3 col-6">
                <div class="card">
                    <div class="card-body text-center">
                        <div class="fs-3 fw-bold text-${color || 'dark'}">${value}</div>
                        <div class="text-muted small">${label}</div>
                    </div>
                </div>
            </div>
        `;
    }

    Api.get('/admin/dashboard').done((res) => {
        const s = res.stats;
        $('#stat-cards').html(
            statCard('Total Employees', s.total_employees) +
            statCard('Clocked In Today', s.clocked_in_today, 'success') +
            statCard('Pending Leave', s.pending_leave, 'warning') +
            statCard('Pending Borrow', s.pending_borrow, 'warning') +
            statCard('Overdue Equipment', s.overdue_borrow, 'danger')
        );

        const leaveList = $('#recent-leave');
        if (!res.recent_leave.length) {
            leaveList.html('<p class="text-muted mb-0">Nothing pending.</p>');
        } else {
            leaveList.html('<ul class="list-unstyled mb-2">' + res.recent_leave.map((l) =>
                `<li>${l.user ? l.user.name : (l.guest_name + ' (guest)')} — ${l.type}, ${l.start_date}→${l.end_date}</li>`
            ).join('') + '</ul>');
        }

        const borrowList = $('#recent-borrow');
        if (!res.recent_borrow.length) {
            borrowList.html('<p class="text-muted mb-0">Nothing pending.</p>');
        } else {
            borrowList.html('<ul class="list-unstyled mb-2">' + res.recent_borrow.map((b) =>
                `<li>${b.user ? b.user.name : (b.guest_name + ' (guest)')} — ${b.equipment ? b.equipment.code : ''}, ${b.borrow_date}→${b.return_date}</li>`
            ).join('') + '</ul>');
        }
    }).fail((err) => showAlert('#alert-box', err));
});
