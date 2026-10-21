<?php
require_once __DIR__ . '/koneksi.php';
require_once __DIR__ . '/db_helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = load_inventory_transactions($conn);
    if (!empty($_GET['type'])) $rows = array_values(array_filter($rows, fn($row) => $row['type'] === $_GET['type']));
    send_json(['status' => 'success', 'data' => $rows]);
}

if ($method === 'POST') {
    $payload = read_json_body();
    if (empty($payload['id'])) $payload['id'] = 'it_' . bin2hex(random_bytes(8));
    if (empty($payload['medicineId'])) send_json(['status' => 'error', 'message' => 'medicineId wajib diisi'], 400);
    if (empty($payload['createdAt'])) $payload['createdAt'] = date('c');

    $state = load_clinic_state($conn);
    array_unshift($state['inventoryTransactions'], $payload);
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
    $stmt = $conn->prepare('UPDATE inventory_transactions SET deleted_at = NOW() WHERE id = ?');
    $stmt->bind_param('s', $id);
    $stmt->execute();
    send_json(['status' => 'success', 'message' => 'Transaksi barang berhasil dihapus']);
}

send_json(['status' => 'error', 'message' => 'Method tidak didukung'], 405);
?>
