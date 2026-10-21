<?php
require_once __DIR__ . '/koneksi.php';
require_once __DIR__ . '/db_helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    send_json([
        'status' => 'success',
        'data' => [
            'masterServices' => load_master_services($conn),
            'masterActions' => load_master_actions_only($conn),
            'masterLabs' => load_master_labs($conn),
            'masterPoli' => load_master_poli($conn),
            'masterInpatients' => load_master_inpatients($conn),
        ]
    ]);
}

if ($method === 'POST' || $method === 'PUT') {
    $payload = read_json_body();
    $conn->begin_transaction();
    try {
        replace_master_tables($conn, $payload);
        $conn->commit();
        send_json(['status' => 'success', 'message' => 'Master data berhasil disimpan ke database']);
    } catch (Throwable $e) {
        $conn->rollback();
        send_json(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}

if ($method === 'DELETE') {
    $kind = $_GET['kind'] ?? '';
    $id = $_GET['id'] ?? '';
    if ($kind === '' || $id === '') send_json(['status' => 'error', 'message' => 'Parameter kind dan id wajib diisi'], 400);

    $map = [
        'service' => ['table' => 'services', 'name' => 'service'],
        'action' => ['table' => 'actions', 'name' => 'action'],
        'lab' => ['table' => 'actions', 'name' => 'lab'],
        'poli' => ['table' => 'poli', 'name' => 'poli'],
        'inpatient' => ['table' => 'inpatient_masters', 'name' => 'rawat_inap'],
    ];
    if (!isset($map[$kind])) send_json(['status' => 'error', 'message' => 'Jenis master tidak valid'], 400);

    $dbId = preg_replace('/\D+/', '', $id);
    if ($dbId === '') $dbId = $id;
    $table = $map[$kind]['table'];

    if (!table_exists($conn, $table)) send_json(['status' => 'error', 'message' => 'Tabel master tidak tersedia'], 500);
    $stmt = $conn->prepare("DELETE FROM `$table` WHERE id = ?");
    $stmt->bind_param('s', $dbId);
    $stmt->execute();
    send_json(['status' => 'success', 'message' => 'Master data berhasil dihapus permanen dari database']);
}

send_json(['status' => 'error', 'message' => 'Method tidak didukung'], 405);
?>
