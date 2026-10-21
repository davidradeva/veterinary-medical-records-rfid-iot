<?php
require_once __DIR__ . '/koneksi.php';
require_once __DIR__ . '/db_helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!table_exists($conn, 'inpatient_refusal_letters')) {
    send_json(['status' => 'error', 'message' => 'Tabel inpatient_refusal_letters belum ada. Import patch V70 dulu.'], 500);
}

if ($method === 'GET') {
    send_json(['status' => 'success', 'data' => load_refusal_letters($conn)]);
}

if ($method === 'POST' || $method === 'PUT') {
    $p = read_json_body();
    $id = (string)($p['id'] ?? ('ref_' . bin2hex(random_bytes(8))));
    $visitId = nullable_string($p['visitId'] ?? null);
    $animalId = (string)($p['animalId'] ?? '');
    if ($animalId === '') send_json(['status' => 'error', 'message' => 'animalId wajib diisi'], 400);

    $ownerId = nullable_string($p['ownerId'] ?? null);
    $refusalDate = mysql_datetime($p['refusalDate'] ?? null);
    $ownerName = (string)($p['ownerNameSnapshot'] ?? '');
    $animalName = (string)($p['animalNameSnapshot'] ?? '');
    $customer = (string)($p['customerNumberSnapshot'] ?? '');
    $rfid = (string)($p['rfidUidSnapshot'] ?? '');
    $doctorName = (string)($p['doctorName'] ?? '');
    $staffName = (string)($p['staffName'] ?? 'Front Office');
    $reason = (string)($p['reason'] ?? '');
    $diagnosis = (string)($p['diagnosis'] ?? '');
    $recommendedTreatment = (string)($p['recommendedTreatment'] ?? 'Rawat inap');
    $riskExplanation = (string)($p['riskExplanation'] ?? 'Pemilik telah mendapat penjelasan mengenai risiko jika rawat inap tidak dilakukan.');
    $refusalStatement = (string)($p['refusalStatement'] ?? 'Pemilik menolak rawat inap atas kehendak sendiri.');
    $signatureOwnerName = (string)($p['signatureOwnerName'] ?? $ownerName);
    $witnessName = (string)($p['witnessName'] ?? '');
    $raw = json_encode($p, JSON_UNESCAPED_UNICODE);

    $stmt = $conn->prepare("INSERT INTO inpatient_refusal_letters (id, visit_id, animal_id, owner_id, refusal_date, owner_name_snapshot, animal_name_snapshot, customer_number_snapshot, rfid_uid_snapshot, doctor_name, staff_name, reason, diagnosis, recommended_treatment, risk_explanation, refusal_statement, signature_owner_name, witness_name, raw_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE visit_id=VALUES(visit_id), animal_id=VALUES(animal_id), owner_id=VALUES(owner_id), refusal_date=VALUES(refusal_date), owner_name_snapshot=VALUES(owner_name_snapshot), animal_name_snapshot=VALUES(animal_name_snapshot), customer_number_snapshot=VALUES(customer_number_snapshot), rfid_uid_snapshot=VALUES(rfid_uid_snapshot), doctor_name=VALUES(doctor_name), staff_name=VALUES(staff_name), reason=VALUES(reason), diagnosis=VALUES(diagnosis), recommended_treatment=VALUES(recommended_treatment), risk_explanation=VALUES(risk_explanation), refusal_statement=VALUES(refusal_statement), signature_owner_name=VALUES(signature_owner_name), witness_name=VALUES(witness_name), raw_json=VALUES(raw_json), updated_at=NOW(), deleted_at=NULL");
    $stmt->bind_param('sssssssssssssssssss', $id, $visitId, $animalId, $ownerId, $refusalDate, $ownerName, $animalName, $customer, $rfid, $doctorName, $staffName, $reason, $diagnosis, $recommendedTreatment, $riskExplanation, $refusalStatement, $signatureOwnerName, $witnessName, $raw);
    $stmt->execute();

    send_json(['status' => 'success', 'data' => array_merge($p, ['id' => $id])]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if ($id === '') send_json(['status' => 'error', 'message' => 'Parameter id wajib diisi'], 400);
    $stmt = $conn->prepare('UPDATE inpatient_refusal_letters SET deleted_at = NOW() WHERE id = ?');
    $stmt->bind_param('s', $id);
    $stmt->execute();
    send_json(['status' => 'success', 'message' => 'Surat penolakan dihapus']);
}

send_json(['status' => 'error', 'message' => 'Method tidak didukung'], 405);
?>
