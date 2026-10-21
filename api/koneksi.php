<?php
// Konfigurasi koneksi database untuk cPanel/MySQL.
// Ubah 4 nilai di bawah sesuai database cPanel kamu.
header('Content-Type: application/json; charset=utf-8');

$host = 'localhost';
$user = 'USERNAME_CPANEL_DB';
$pass = 'PASSWORD_CPANEL_DB';
$db   = 'NAMA_DATABASE_CPANEL';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Koneksi database gagal. Periksa host, user, password, dan nama database di api/koneksi.php'
    ]);
    exit;
}
$conn->set_charset('utf8mb4');

function read_json_body(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function send_json($payload, int $code = 200): void {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}
?>
