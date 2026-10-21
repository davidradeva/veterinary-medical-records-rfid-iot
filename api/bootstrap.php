<?php
require_once __DIR__ . '/koneksi.php';
require_once __DIR__ . '/db_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json(['status' => 'error', 'message' => 'Method tidak didukung'], 405);
}

try {
    $hasOperationalData = relational_state_has_data($conn);
    $data = load_clinic_state($conn);

    send_json([
        'status' => $hasOperationalData ? 'success' : 'empty',
        'source' => 'relational_v57_clean',
        'data' => $data,
    ]);
} catch (Throwable $e) {
    send_json(['status' => 'error', 'message' => $e->getMessage()], 500);
}
?>
