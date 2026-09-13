$(function () {
    Nav.requireAdmin();
    Nav.render('admin', '../');

    let currentPage = 1;
    let searchTimer = null;

    function load() {
        const search = $('#search-input').val();
        $('#employees-body').html('<tr><td colspan="6" class="text-center text-muted py-4">Loading...</td></tr>');

        const query = new URLSearchParams({ page: currentPage });
        if (search) query.set('search', search);

        Api.get(`/admin/employees?${query.toString()}`).done((res) => {
            const tbody = $('#employees-body').empty();
            if (!res.data.length) {
                tbody.html('<tr><td colspan="6" class="text-center text-muted py-4">No employees found.</td></tr>');
                return;
            }
            res.data.forEach((e) => {
                tbody.append(`
                    <tr>
                        <td>${e.name}</td>
                        <td>${e.email}</td>
                        <td>${e.attendances_count}</td>
                        <td>${e.leave_requests_count}</td>
                        <td>${e.borrow_requests_count}</td>
                        <td><a href="employee.html?id=${e.id}" class="btn btn-sm btn-outline-primary">View</a></td>
                    </tr>
                `);
            });

            const pag = $('#pagination').empty();
            for (let p = 1; p <= res.last_page; p++) {
                pag.append(`<li class="page-item ${p === res.current_page ? 'active' : ''}"><a class="page-link" href="#" data-page="${p}">${p}</a></li>`);
            }
        }).fail((err) => showAlert('#alert-box', err));
    }

    $('#search-input').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => { currentPage = 1; load(); }, 350);
    });

    $('#pagination').on('click', 'a.page-link', function (e) {
        e.preventDefault();
        currentPage = parseInt($(this).data('page'), 10);
        load();
    });

    load();
});
