<?php
require_once __DIR__ . '/koneksi.php';
require_once __DIR__ . '/db_helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = load_visits($conn);
    if (!empty($_GET['status'])) {
        $rows = array_values(array_filter($rows, fn($row) => ($row['status'] ?? '') === $_GET['status']));
    }
    if (!empty($_GET['patientId'])) {
        $rows = array_values(array_filter($rows, fn($row) => ($row['patientId'] ?? '') === $_GET['patientId']));
    }
    send_json(['status' => 'success', 'data' => $rows]);
}

if ($method === 'POST' || $method === 'PUT') {
    $payload = read_json_body();
    if (empty($payload['id'])) $payload['id'] = 'v_' . bin2hex(random_bytes(8));
    if (empty($payload['visitDate'])) $payload['visitDate'] = date('c');
    if (empty($payload['patientId'])) send_json(['status' => 'error', 'message' => 'patientId wajib diisi'], 400);
    if (!isset($payload['medicineItems'])) $payload['medicineItems'] = [];

    $state = load_clinic_state($conn);
    $visits = $state['visits'];
    $updated = false;
    foreach ($visits as &$visit) {
        if ($visit['id'] === $payload['id']) {
            $visit = array_merge($visit, $payload);
            $updated = true;
            break;
        }
    }
    unset($visit);
    if (!$updated) array_unshift($visits, $payload);
    $state['visits'] = $visits;

    $conn->begin_transaction();
    try {
        replace_relational_state($conn, $state);
        $conn->commit();
        send_json(['status' => 'success', 'data' => $payload]);
    } catch (Throwable $e) {
        $conn->rollback();
        send_json(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if ($id === '') send_json(['status' => 'error', 'message' => 'Parameter id wajib diisi'], 400);
    $stmt = $conn->prepare('UPDATE visits SET deleted_at = NOW() WHERE id = ?');
    $stmt->bind_param('s', $id);
    $stmt->execute();
    send_json(['status' => 'success', 'message' => 'Kunjungan berhasil dihapus']);
}

send_json(['status' => 'error', 'message' => 'Method tidak didukung'], 405);
?>
