<?php
require_once __DIR__ . '/koneksi.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['status' => 'error', 'message' => 'Method tidak didukung'], 405);
}

$payload = read_json_body();
$username = trim($payload['username'] ?? '');
$password = (string)($payload['password'] ?? '');

if ($username === '' || $password === '') {
    send_json(['status' => 'error', 'message' => 'Username dan password wajib diisi'], 400);
}

$hash = hash('sha256', $password);
$stmt = $conn->prepare('SELECT id, username, role, staff_name FROM users WHERE username = ? AND password_hash = ? AND is_active = 1 LIMIT 1');
$stmt->bind_param('ss', $username, $hash);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    send_json(['status' => 'error', 'message' => 'Username atau password salah'], 401);
}

send_json([
    'status' => 'success',
    'user' => [
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'staffName' => $user['staff_name'],
    ]
]);
?>
