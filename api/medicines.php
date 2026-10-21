<?php
require_once __DIR__ . '/koneksi.php';
require_once __DIR__ . '/db_helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') send_json(['status' => 'success', 'data' => load_medicines($conn)]);

if ($method === 'POST' || $method === 'PUT') {
    $payload = read_json_body();
    if (empty($payload['id'])) $payload['id'] = 'm_' . bin2hex(random_bytes(8));
    if (empty($payload['name'])) send_json(['status' => 'error', 'message' => 'Nama obat wajib diisi'], 400);
    $id = $payload['id'];
    $name = $payload['name'];
    $stock = int_value($payload['stock'] ?? 0);
    $unit = $payload['unit'] ?? '';
    $price = int_value($payload['price'] ?? 0);
    $category = $payload['category'] ?? '';
    $stmt = $conn->prepare("INSERT INTO medicines (id, name, stock, unit, price, category, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW()) ON DUPLICATE KEY UPDATE name=VALUES(name), stock=VALUES(stock), unit=VALUES(unit), price=VALUES(price), category=VALUES(category), is_active=1, deleted_at=NULL, updated_at=NOW()");
    $stmt->bind_param('ssisis', $id, $name, $stock, $unit, $price, $category);
    $stmt->execute();
    send_json(['status' => 'success', 'data' => $payload]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if ($id === '') send_json(['status' => 'error', 'message' => 'Parameter id wajib diisi'], 400);

    $conn->begin_transaction();
    try {
        // Riwayat transaksi/rekam medis tetap disimpan sebagai teks nama obat, tetapi master obat dihapus dari tabel medicines.
        if (table_exists($conn, 'visit_medicines')) {
            $stmt = $conn->prepare('UPDATE visit_medicines SET medicine_id = NULL WHERE medicine_id = ?');
            $stmt->bind_param('s', $id);
            $stmt->execute();
        }
        if (table_exists($conn, 'inventory_transactions')) {
            $stmt = $conn->prepare('UPDATE inventory_transactions SET medicine_id = NULL WHERE medicine_id = ?');
            $stmt->bind_param('s', $id);
            $stmt->execute();
        }
        $stmt = $conn->prepare('DELETE FROM medicines WHERE id = ?');
        $stmt->bind_param('s', $id);
        $stmt->execute();
        $conn->commit();
        send_json(['status' => 'success', 'message' => 'Obat berhasil dihapus permanen dari master obat']);
    } catch (Throwable $e) {
        $conn->rollback();
        send_json(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}

send_json(['status' => 'error', 'message' => 'Method tidak didukung'], 405);
?>
