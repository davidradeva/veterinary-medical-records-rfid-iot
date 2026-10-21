<?php
require_once __DIR__ . '/koneksi.php';
require_once __DIR__ . '/db_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['status' => 'error', 'message' => 'Method tidak didukung'], 405);
}

$payload = read_json_body();

$conn->begin_transaction();
try {
    replace_relational_state($conn, $payload);

    // app_state hanya backup/snapshot, bukan sumber utama.
    if (table_exists($conn, 'app_state')) {
        $allowed = ['patients', 'visits', 'medicines', 'inventoryTransactions', 'financeEntries', 'masterServices', 'masterActions', 'masterLabs', 'masterPoli'];
        $stmt = $conn->prepare('REPLACE INTO app_state (key_name, json_data, updated_at) VALUES (?, ?, NOW())');
        foreach ($allowed as $key) {
            if (!array_key_exists($key, $payload)) continue;
            $json = json_encode($payload[$key], JSON_UNESCAPED_UNICODE);
            $stmt->bind_param('ss', $key, $json);
            $stmt->execute();
        }
    }

    $conn->commit();
    send_json(['status' => 'success', 'source' => 'relational_v57_clean', 'message' => 'Data berhasil disimpan ke tabel relasional v57']);
} catch (Throwable $e) {
    $conn->rollback();
    send_json(['status' => 'error', 'message' => $e->getMessage()], 500);
}
?>
