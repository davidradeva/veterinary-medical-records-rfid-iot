<?php
require_once __DIR__ . '/koneksi.php';
require_once __DIR__ . '/db_helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = load_finance_entries($conn);
    if (!empty($_GET['type'])) $rows = array_values(array_filter($rows, fn($row) => $row['type'] === $_GET['type']));
    if (!empty($_GET['date'])) $rows = array_values(array_filter($rows, fn($row) => substr($row['createdAt'], 0, 10) === $_GET['date']));
    send_json(['status' => 'success', 'data' => $rows]);
}

if ($method === 'POST' || $method === 'PUT') {
    $payload = read_json_body();
    if (empty($payload['id'])) $payload['id'] = 'f_' . bin2hex(random_bytes(8));
    if (empty($payload['createdAt'])) $payload['createdAt'] = date('c');
    if (empty($payload['title'])) send_json(['status' => 'error', 'message' => 'Judul catatan wajib diisi'], 400);

    $state = load_clinic_state($conn);
    $updated = false;
    foreach ($state['financeEntries'] as &$row) {
        if ($row['id'] === $payload['id']) {
            $row = array_merge($row, $payload);
            $updated = true;
            break;
        }
    }
    unset($row);
    if (!$updated) array_unshift($state['financeEntries'], $payload);
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
    $stmt = $conn->prepare('UPDATE finance_entries SET deleted_at = NOW() WHERE id = ?');
    $stmt->bind_param('s', $id);
    $stmt->execute();
    send_json(['status' => 'success', 'message' => 'Catatan keuangan berhasil dihapus']);
}

send_json(['status' => 'error', 'message' => 'Method tidak didukung'], 405);
?>
