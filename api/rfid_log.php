<?php
require_once __DIR__ . '/koneksi.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['status' => 'error', 'message' => 'Method tidak didukung'], 405);
}

$payload = read_json_body();
$uid = trim($payload['uid'] ?? '');
$status = trim($payload['status'] ?? 'scanned');
$source = trim($payload['source'] ?? 'ESP32-RC522');

if ($uid === '') send_json(['status' => 'error', 'message' => 'UID kosong'], 400);

$stmt = $conn->prepare('INSERT INTO rfid_logs (uid, source, status) VALUES (?, ?, ?)');
$stmt->bind_param('sss', $uid, $source, $status);
$stmt->execute();

send_json(['status' => 'success', 'id' => $conn->insert_id]);
?>
