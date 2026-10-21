<?php
require_once __DIR__ . '/koneksi.php';
require_once __DIR__ . '/db_helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = $_GET['id'] ?? '';
    $rows = load_patients($conn);
    if ($id !== '') {
        foreach ($rows as $row) {
            if ($row['id'] === $id) send_json(['status' => 'success', 'data' => $row]);
        }
        send_json(['status' => 'error', 'message' => 'Data pasien tidak ditemukan'], 404);
    }
    send_json(['status' => 'success', 'data' => $rows]);
}

if ($method === 'POST' || $method === 'PUT') {
    $payload = read_json_body();
    if (empty($payload['id'])) $payload['id'] = 'p_' . bin2hex(random_bytes(8));
    if (empty($payload['customerNumber'])) $payload['customerNumber'] = 'REG-' . date('YmdHis');
    if (empty($payload['createdAt'])) $payload['createdAt'] = date('c');
    if (empty($payload['ownerName']) || empty($payload['phoneNumber']) || empty($payload['animalName']) || empty($payload['animalType'])) {
        send_json(['status' => 'error', 'message' => 'Nama pemilik, nomor HP, nama hewan, dan jenis hewan wajib diisi'], 400);
    }

    $state = load_clinic_state($conn);
    $patients = $state['patients'];
    $updated = false;
    foreach ($patients as &$patient) {
        if ($patient['id'] === $payload['id']) {
            $patient = array_merge($patient, $payload);
            $updated = true;
            break;
        }
    }
    unset($patient);
    if (!$updated) array_unshift($patients, $payload);
    $state['patients'] = $patients;

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

    $conn->begin_transaction();
    try {
        $ownerId = null;
        $stmtOwner = $conn->prepare('SELECT owner_id FROM animals WHERE id = ? LIMIT 1');
        $stmtOwner->bind_param('s', $id);
        $stmtOwner->execute();
        $ownerRes = $stmtOwner->get_result();
        if ($ownerRow = $ownerRes->fetch_assoc()) $ownerId = $ownerRow['owner_id'];

        $visitIds = [];
        $stmt = $conn->prepare('SELECT id FROM visits WHERE animal_id = ?');
        $stmt->bind_param('s', $id);
        $stmt->execute();
        $res = $stmt->get_result();
        while ($row = $res->fetch_assoc()) $visitIds[] = $row['id'];

        foreach ($visitIds as $visitId) {
            foreach (['visit_medicines','visit_charges','inpatient_records','payments','payment_installments'] as $table) {
                if (!table_exists($conn, $table)) continue;
                $sql = "DELETE FROM `$table` WHERE visit_id = ?";
                $del = $conn->prepare($sql);
                $del->bind_param('s', $visitId);
                $del->execute();
            }
        }

        $delVisits = $conn->prepare('DELETE FROM visits WHERE animal_id = ?');
        $delVisits->bind_param('s', $id);
        $delVisits->execute();

        $delAnimal = $conn->prepare('DELETE FROM animals WHERE id = ?');
        $delAnimal->bind_param('s', $id);
        $delAnimal->execute();

        if ($ownerId) {
            $check = $conn->prepare('SELECT COUNT(*) AS total FROM animals WHERE owner_id = ?');
            $check->bind_param('s', $ownerId);
            $check->execute();
            $checkRes = $check->get_result()->fetch_assoc();
            if ((int)($checkRes['total'] ?? 0) === 0) {
                $delOwner = $conn->prepare('DELETE FROM owners WHERE id = ?');
                $delOwner->bind_param('s', $ownerId);
                $delOwner->execute();
            }
        }

        $conn->commit();
        send_json(['status' => 'success', 'message' => 'Pasien/hewan berhasil dihapus permanen dari database']);
    } catch (Throwable $e) {
        $conn->rollback();
        send_json(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}

send_json(['status' => 'error', 'message' => 'Method tidak didukung'], 405);
?>
