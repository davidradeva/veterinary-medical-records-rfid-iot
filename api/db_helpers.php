<?php
// Helper database relasional bersih v57.
// Desain ini sengaja tidak memakai FOREIGN KEY keras agar data lama/custom dari React tidak menabrak constraint MySQL.
// Relasi tetap ada lewat kolom owner_id, animal_id, visit_id, medicine_id, dan payment_id.

function nullable_string($value): ?string {
    if ($value === null) return null;
    $value = trim((string)$value);
    return $value === '' ? null : $value;
}

function int_value($value): int {
    if ($value === null || $value === '') return 0;
    $clean = preg_replace('/[^0-9\-]/', '', (string)$value);
    if ($clean === '' || $clean === '-') return 0;
    return (int)$clean;
}

function mysql_datetime($value): string {
    if (!$value) return date('Y-m-d H:i:s');
    $timestamp = strtotime((string)$value);
    if ($timestamp === false) return date('Y-m-d H:i:s');
    return date('Y-m-d H:i:s', $timestamp);
}

function iso_datetime($value): string {
    if (!$value) return date('c');
    $timestamp = strtotime((string)$value);
    if ($timestamp === false) return date('c');
    return date('c', $timestamp);
}

function json_or_empty_array($json): array {
    if (!$json) return [];
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : [];
}

function table_exists(mysqli $conn, string $table): bool {
    $safe = $conn->real_escape_string($table);
    $res = $conn->query("SHOW TABLES LIKE '$safe'");
    return $res && $res->num_rows > 0;
}

function table_has_rows(mysqli $conn, string $table): bool {
    if (!table_exists($conn, $table)) return false;
    $res = $conn->query("SELECT COUNT(*) AS total FROM `$table`");
    if (!$res) return false;
    $row = $res->fetch_assoc();
    return ((int)($row['total'] ?? 0)) > 0;
}

function patient_owner_id(array $patient): string {
    $name = strtolower(trim((string)($patient['ownerName'] ?? '')));
    $phone = preg_replace('/\D+/', '', (string)($patient['phoneNumber'] ?? ''));
    $email = strtolower(trim((string)($patient['email'] ?? '')));
    $key = $name . '|' . $phone . '|' . $email;
    return 'own_' . substr(sha1($key), 0, 20);
}

function normalize_patient_from_row(array $row): array {
    return [
        'id' => $row['animal_id'] ?? $row['id'] ?? '',
        'customerNumber' => $row['customer_number'] ?? '',
        'rfidUid' => $row['rfid_uid'] ?? '',
        'ownerName' => $row['owner_name'] ?? '',
        'address' => $row['address'] ?? '',
        'rtRw' => $row['rt_rw'] ?? '',
        'village' => $row['village'] ?? '',
        'district' => $row['district'] ?? '',
        'city' => $row['city'] ?? '',
        'province' => $row['province'] ?? '',
        'phoneNumber' => $row['phone_number'] ?? '',
        'secondaryPhone' => $row['secondary_phone'] ?? '',
        'email' => $row['email'] ?? '',
        'socialMedia' => $row['social_media'] ?? '',
        'animalName' => $row['animal_name'] ?? '',
        'animalType' => $row['animal_type'] ?? '',
        'breed' => $row['breed'] ?? '',
        'gender' => $row['gender'] ?? 'Jantan',
        'sterilizationStatus' => $row['sterilization_status'] ?? 'Intact',
        'birthDate' => $row['birth_date'] ?? '',
        'ageText' => $row['age_text'] ?? '',
        'colorMark' => $row['color_mark'] ?? '',
        'createdAt' => iso_datetime($row['created_at'] ?? null),
    ];
}

function load_patients(mysqli $conn): array {
    if (!table_exists($conn, 'animals') || !table_exists($conn, 'owners')) return [];
    $sql = "SELECT a.id AS animal_id, a.customer_number, a.rfid_uid, a.animal_name, a.animal_type, a.breed,
                   a.gender, a.sterilization_status, a.birth_date, a.age_text, a.color_mark, a.created_at,
                   o.owner_name, o.address, o.rt_rw, o.village, o.district, o.city, o.province,
                   o.phone_number, o.secondary_phone, o.email, o.social_media
            FROM animals a
            JOIN owners o ON o.id = a.owner_id
            WHERE (a.deleted_at IS NULL) AND (o.deleted_at IS NULL)
            ORDER BY a.created_at DESC, a.customer_number DESC";
    $result = $conn->query($sql);
    $rows = [];
    if ($result) while ($row = $result->fetch_assoc()) $rows[] = normalize_patient_from_row($row);
    return $rows;
}

function load_medicines(mysqli $conn): array {
    if (!table_exists($conn, 'medicines')) return [];
    $result = $conn->query("SELECT id, name, stock, unit, price, category FROM medicines WHERE is_active = 1 AND deleted_at IS NULL ORDER BY name ASC");
    $rows = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $rows[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'stock' => (int)$row['stock'],
                'unit' => $row['unit'] ?? '',
                'price' => (int)$row['price'],
                'category' => $row['category'] ?? '',
            ];
        }
    }
    return $rows;
}

function load_visit_medicines(mysqli $conn, string $visitId): array {
    if (!table_exists($conn, 'visit_medicines')) return [];
    $stmt = $conn->prepare("SELECT medicine_id, name, price, quantity, medicine_type, custom_name FROM visit_medicines WHERE visit_id = ? ORDER BY id ASC");
    $stmt->bind_param('s', $visitId);
    $stmt->execute();
    $res = $stmt->get_result();
    $items = [];
    while ($row = $res->fetch_assoc()) {
        $items[] = [
            'medicineId' => $row['medicine_id'] ?? '',
            'name' => $row['name'] ?? '',
            'price' => (int)$row['price'],
            'quantity' => (int)$row['quantity'],
            'medicineType' => $row['medicine_type'] ?? '',
            'customName' => $row['custom_name'] ?? '',
        ];
    }
    return $items;
}

function load_visits(mysqli $conn): array {
    if (!table_exists($conn, 'visits')) return [];
    $result = $conn->query("SELECT * FROM visits WHERE deleted_at IS NULL ORDER BY visit_date DESC, created_at DESC");
    $rows = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $raw = json_or_empty_array($row['raw_json'] ?? null);
            $base = [
                'id' => $row['id'],
                'patientId' => $row['animal_id'] ?? '',
                'visitDate' => iso_datetime($row['visit_date'] ?? null),
                'poli' => $row['poli'] ?? '',
                'doctor' => $row['doctor'] ?? '',
                'status' => $row['status'] ?? 'pending',
                'complaint' => $row['complaint'] ?? '',
                'weight' => $row['weight'] ?? '',
                'temperature' => $row['temperature'] ?? '',
                'examResult' => $row['exam_result'] ?? '',
                'labResult' => $row['lab_result'] ?? '',
                'diagnosis' => $row['diagnosis'] ?? '',
                'prognosis' => $row['prognosis'] ?? '',
                'medicalAction' => $row['medical_action'] ?? '',
                'notes' => $row['notes'] ?? '',
                'recommendations' => $row['recommendations'] ?? '',
                'medicineItems' => load_visit_medicines($conn, $row['id']),
                'totalCost' => (int)$row['total_cost'],
                'paymentStatus' => $row['payment_status'] ?? 'Menunggu Pembayaran',
                'billingStatus' => $row['billing_status'] ?? ($raw['billingStatus'] ?? 'belum_ditagih'),
                'doctorDoneAt' => !empty($row['doctor_done_at']) ? iso_datetime($row['doctor_done_at']) : ($raw['doctorDoneAt'] ?? ''),
                'foBillingDoneAt' => !empty($row['fo_billing_done_at']) ? iso_datetime($row['fo_billing_done_at']) : ($raw['foBillingDoneAt'] ?? ''),
            ];
            // Raw disimpan agar field yang belum punya kolom khusus tetap hidup di React.
            $rows[] = array_merge($raw, $base);
        }
    }
    return $rows;
}

function load_inventory_transactions(mysqli $conn): array {
    if (!table_exists($conn, 'inventory_transactions')) return [];
    $result = $conn->query("SELECT * FROM inventory_transactions WHERE deleted_at IS NULL ORDER BY created_at DESC");
    $rows = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $rows[] = [
                'id' => $row['id'],
                'medicineId' => $row['medicine_id'] ?? '',
                'medicineName' => $row['medicine_name'] ?? '',
                'type' => $row['type'],
                'quantity' => (int)$row['quantity'],
                'unitPrice' => (int)$row['unit_price'],
                'total' => (int)$row['total'],
                'note' => $row['note'] ?? '',
                'createdAt' => iso_datetime($row['created_at'] ?? null),
            ];
        }
    }
    return $rows;
}

function load_finance_entries(mysqli $conn): array {
    if (!table_exists($conn, 'finance_entries')) return [];
    $result = $conn->query("SELECT * FROM finance_entries WHERE deleted_at IS NULL ORDER BY created_at DESC");
    $rows = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $rows[] = [
                'id' => $row['id'],
                'type' => $row['type'],
                'category' => $row['category'],
                'title' => $row['title'],
                'amount' => (int)$row['amount'],
                'note' => $row['note'] ?? '',
                'createdAt' => iso_datetime($row['created_at'] ?? null),
            ];
        }
    }
    return $rows;
}

function load_master_services(mysqli $conn): array {
    if (!table_exists($conn, 'services')) return [];
    $result = $conn->query("SELECT id, service_name AS name, price_min, price_max FROM services WHERE is_active = 1 AND deleted_at IS NULL ORDER BY service_name ASC");
    $rows = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $max = (int)($row['price_max'] ?? 0);
            $rows[] = [
                'id' => 'svc_' . (string)$row['id'],
                'dbId' => (int)$row['id'],
                'name' => $row['name'] ?? '',
                'minPrice' => (int)($row['price_min'] ?? 0),
                'maxPrice' => $max > 0 ? $max : null,
            ];
        }
    }
    return $rows;
}

function load_master_actions(mysqli $conn): array {
    if (!table_exists($conn, 'actions')) return [];
    $result = $conn->query("SELECT id, action_name AS name, action_type, price_min, price_max FROM actions WHERE is_active = 1 AND deleted_at IS NULL ORDER BY action_name ASC");
    $rows = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $max = (int)($row['price_max'] ?? 0);
            $rows[] = [
                'id' => 'act_' . (string)$row['id'],
                'dbId' => (int)$row['id'],
                'name' => $row['name'] ?? '',
                'type' => $row['action_type'] ?? 'tindakan',
                'minPrice' => (int)($row['price_min'] ?? 0),
                'maxPrice' => $max > 0 ? $max : null,
            ];
        }
    }
    return $rows;
}

function load_master_actions_only(mysqli $conn): array {
    return array_values(array_filter(load_master_actions($conn), function ($row) {
        return (($row['type'] ?? 'tindakan') === 'tindakan');
    }));
}

function load_master_labs(mysqli $conn): array {
    return array_values(array_filter(load_master_actions($conn), function ($row) {
        return (($row['type'] ?? 'tindakan') !== 'tindakan');
    }));
}

function load_master_poli(mysqli $conn): array {
    if (!table_exists($conn, 'poli')) return [];
    $result = $conn->query("SELECT id, poli_name AS name, default_doctor, price_min, price_max FROM poli WHERE is_active = 1 AND deleted_at IS NULL ORDER BY poli_name ASC");
    $rows = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $max = (int)($row['price_max'] ?? 0);
            $rows[] = [
                'id' => 'poli_' . (string)$row['id'],
                'dbId' => (int)$row['id'],
                'name' => $row['name'] ?? '',
                'defaultDoctor' => $row['default_doctor'] ?? '',
                'minPrice' => (int)($row['price_min'] ?? 0),
                'maxPrice' => $max > 0 ? $max : null,
            ];
        }
    }
    return $rows;
}

function load_master_inpatients(mysqli $conn): array {
    if (!table_exists($conn, 'inpatient_masters')) return [];
    $result = $conn->query("SELECT id, inpatient_name AS name, price_min, price_max, unit FROM inpatient_masters WHERE is_active = 1 AND deleted_at IS NULL ORDER BY inpatient_name ASC");
    $rows = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $max = (int)($row['price_max'] ?? 0);
            $rows[] = [
                'id' => 'inp_' . (string)$row['id'],
                'dbId' => (int)$row['id'],
                'name' => $row['name'] ?? '',
                'type' => 'rawat_inap',
                'minPrice' => (int)($row['price_min'] ?? 0),
                'maxPrice' => $max > 0 ? $max : null,
                'unit' => $row['unit'] ?? 'hari',
            ];
        }
    }
    return $rows;
}

function load_refusal_letters(mysqli $conn): array {
    if (!table_exists($conn, 'inpatient_refusal_letters')) return [];
    $result = $conn->query("SELECT * FROM inpatient_refusal_letters WHERE deleted_at IS NULL ORDER BY refusal_date DESC, created_at DESC LIMIT 500");
    $rows = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $raw = json_or_empty_array($row['raw_json'] ?? null);
            $base = [
                'id' => $row['id'],
                'visitId' => $row['visit_id'] ?? '',
                'animalId' => $row['animal_id'] ?? '',
                'ownerId' => $row['owner_id'] ?? '',
                'refusalDate' => iso_datetime($row['refusal_date'] ?? null),
                'ownerNameSnapshot' => $row['owner_name_snapshot'] ?? '',
                'animalNameSnapshot' => $row['animal_name_snapshot'] ?? '',
                'customerNumberSnapshot' => $row['customer_number_snapshot'] ?? '',
                'rfidUidSnapshot' => $row['rfid_uid_snapshot'] ?? '',
                'doctorName' => $row['doctor_name'] ?? '',
                'staffName' => $row['staff_name'] ?? '',
                'reason' => $row['reason'] ?? '',
                'diagnosis' => $row['diagnosis'] ?? '',
                'recommendedTreatment' => $row['recommended_treatment'] ?? '',
                'riskExplanation' => $row['risk_explanation'] ?? '',
                'refusalStatement' => $row['refusal_statement'] ?? '',
                'signatureOwnerName' => $row['signature_owner_name'] ?? '',
                'witnessName' => $row['witness_name'] ?? '',
                'createdAt' => iso_datetime($row['created_at'] ?? null),
            ];
            $rows[] = array_merge($raw, $base);
        }
    }
    return $rows;
}


function load_clinic_state(mysqli $conn): array {
    return [
        'patients' => load_patients($conn),
        'visits' => load_visits($conn),
        'medicines' => load_medicines($conn),
        'inventoryTransactions' => load_inventory_transactions($conn),
        'financeEntries' => load_finance_entries($conn),
        'masterServices' => load_master_services($conn),
        'masterActions' => load_master_actions_only($conn),
        'masterLabs' => load_master_labs($conn),
        'masterPoli' => load_master_poli($conn),
        'masterInpatients' => load_master_inpatients($conn),
        'refusalLetters' => load_refusal_letters($conn),
    ];
}

function valid_existing_medicine_id(mysqli $conn, $medicineId): ?string {
    $medicineId = nullable_string($medicineId);
    if ($medicineId === null || strtolower($medicineId) === 'custom') return null;
    if (!table_exists($conn, 'medicines')) return null;
    $stmt = $conn->prepare("SELECT id FROM medicines WHERE id = ? LIMIT 1");
    $stmt->bind_param('s', $medicineId);
    $stmt->execute();
    $res = $stmt->get_result();
    return ($res && $res->num_rows > 0) ? $medicineId : null;
}

function bool_value($value): int {
    return ($value === true || $value === 1 || $value === '1' || $value === 'true') ? 1 : 0;
}

function default_doctor_for_poli(string $name): string {
    $lower = strtolower($name);
    if (strpos($lower, 'bedah') !== false) return 'Dr. A';
    if (strpos($lower, 'dermatologi') !== false || strpos($lower, 'laboratorium') !== false) return 'Dr. C';
    return 'Dr. B';
}

function replace_master_tables(mysqli $conn, array $payload): void {
    if (array_key_exists('masterServices', $payload) && is_array($payload['masterServices']) && table_exists($conn, 'services')) {
        $conn->query("DELETE FROM services");
        $stmt = $conn->prepare("INSERT INTO services (service_name, price_min, price_max, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, NOW(), NOW())");
        foreach ($payload['masterServices'] as $item) {
            $name = trim((string)($item['name'] ?? ''));
            if ($name === '') continue;
            $min = int_value($item['minPrice'] ?? 0);
            $max = int_value($item['maxPrice'] ?? 0);
            $stmt->bind_param('sii', $name, $min, $max);
            $stmt->execute();
        }
    }

    if ((array_key_exists('masterActions', $payload) || array_key_exists('masterLabs', $payload)) && table_exists($conn, 'actions')) {
        $conn->query("DELETE FROM actions");
        $stmt = $conn->prepare("INSERT INTO actions (action_name, action_type, price_min, price_max, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, NOW(), NOW())");
        $combinedActions = [];
        if (isset($payload['masterActions']) && is_array($payload['masterActions'])) {
            foreach ($payload['masterActions'] as $item) {
                $item['type'] = 'tindakan';
                $combinedActions[] = $item;
            }
        }
        if (isset($payload['masterLabs']) && is_array($payload['masterLabs'])) {
            foreach ($payload['masterLabs'] as $item) {
                $item['type'] = 'lab';
                $combinedActions[] = $item;
            }
        }
        foreach ($combinedActions as $item) {
            $name = trim((string)($item['name'] ?? ''));
            if ($name === '') continue;
            $type = trim((string)($item['type'] ?? 'tindakan')) ?: 'tindakan';
            $min = int_value($item['minPrice'] ?? 0);
            $max = int_value($item['maxPrice'] ?? 0);
            $stmt->bind_param('ssii', $name, $type, $min, $max);
            $stmt->execute();
        }
    }

    if (array_key_exists('masterPoli', $payload) && is_array($payload['masterPoli']) && table_exists($conn, 'poli')) {
        $conn->query("DELETE FROM poli");
        $stmt = $conn->prepare("INSERT INTO poli (poli_name, default_doctor, price_min, price_max, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, NOW(), NOW())");
        foreach ($payload['masterPoli'] as $item) {
            $name = trim((string)($item['name'] ?? ''));
            if ($name === '') continue;
            $doctor = trim((string)($item['defaultDoctor'] ?? '')) ?: default_doctor_for_poli($name);
            $min = int_value($item['minPrice'] ?? 0);
            $max = int_value($item['maxPrice'] ?? 0);
            $stmt->bind_param('ssii', $name, $doctor, $min, $max);
            $stmt->execute();
        }
    }

    if (array_key_exists('masterInpatients', $payload) && is_array($payload['masterInpatients']) && table_exists($conn, 'inpatient_masters')) {
        $conn->query("DELETE FROM inpatient_masters");
        $stmt = $conn->prepare("INSERT INTO inpatient_masters (inpatient_name, price_min, price_max, unit, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, NOW(), NOW())");
        foreach ($payload['masterInpatients'] as $item) {
            $name = trim((string)($item['name'] ?? ''));
            if ($name === '') continue;
            $min = int_value($item['minPrice'] ?? 0);
            $max = int_value($item['maxPrice'] ?? 0);
            $unit = trim((string)($item['unit'] ?? 'hari')) ?: 'hari';
            $stmt->bind_param('siis', $name, $min, $max, $unit);
            $stmt->execute();
        }
    }
}

function replace_relational_state(mysqli $conn, array $payload): void {
    $patients = is_array($payload['patients'] ?? null) ? $payload['patients'] : [];
    $visits = is_array($payload['visits'] ?? null) ? $payload['visits'] : [];
    $medicines = is_array($payload['medicines'] ?? null) ? $payload['medicines'] : [];
    $inventory = is_array($payload['inventoryTransactions'] ?? null) ? $payload['inventoryTransactions'] : [];
    $finance = is_array($payload['financeEntries'] ?? null) ? $payload['financeEntries'] : [];

    replace_master_tables($conn, $payload);

    foreach (['payment_installments','payments','inpatient_records','visit_charges','visit_medicines','inventory_transactions','finance_entries','visits','animals','owners','medicines'] as $table) {
        if (table_exists($conn, $table)) $conn->query("DELETE FROM `$table`");
    }

    $ownerStmt = $conn->prepare("INSERT INTO owners (id, owner_name, address, rt_rw, village, district, city, province, phone_number, secondary_phone, email, social_media, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
    $animalStmt = $conn->prepare("INSERT INTO animals (id, owner_id, customer_number, rfid_uid, animal_name, animal_type, breed, gender, sterilization_status, birth_date, age_text, color_mark, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");

    $insertedOwners = [];
    foreach ($patients as $p) {
        if (empty($p['id'])) continue;
        $ownerId = patient_owner_id($p);
        if (!isset($insertedOwners[$ownerId])) {
            $ownerName = (string)($p['ownerName'] ?? '');
            $address = (string)($p['address'] ?? '');
            $rtRw = (string)($p['rtRw'] ?? '');
            $village = (string)($p['village'] ?? '');
            $district = (string)($p['district'] ?? '');
            $city = (string)($p['city'] ?? '');
            $province = (string)($p['province'] ?? '');
            $phone = (string)($p['phoneNumber'] ?? '');
            $secondary = (string)($p['secondaryPhone'] ?? '');
            $email = (string)($p['email'] ?? '');
            $social = (string)($p['socialMedia'] ?? '');
            $created = mysql_datetime($p['createdAt'] ?? null);
            $ownerStmt->bind_param('sssssssssssss', $ownerId, $ownerName, $address, $rtRw, $village, $district, $city, $province, $phone, $secondary, $email, $social, $created);
            $ownerStmt->execute();
            $insertedOwners[$ownerId] = true;
        }
        $animalId = (string)$p['id'];
        $customer = (string)($p['customerNumber'] ?? $animalId);
        $rfid = nullable_string($p['rfidUid'] ?? null);
        $animalName = (string)($p['animalName'] ?? '');
        $animalType = (string)($p['animalType'] ?? '');
        $breed = (string)($p['breed'] ?? '');
        $gender = (string)($p['gender'] ?? 'Jantan');
        $sterilization = (string)($p['sterilizationStatus'] ?? 'Intact');
        $birth = nullable_string($p['birthDate'] ?? null);
        $age = (string)($p['ageText'] ?? '');
        $color = (string)($p['colorMark'] ?? '');
        $created = mysql_datetime($p['createdAt'] ?? null);
        $animalStmt->bind_param('sssssssssssss', $animalId, $ownerId, $customer, $rfid, $animalName, $animalType, $breed, $gender, $sterilization, $birth, $age, $color, $created);
        $animalStmt->execute();
    }

    $medStmt = $conn->prepare("INSERT INTO medicines (id, name, stock, unit, price, category, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())");
    foreach ($medicines as $m) {
        if (empty($m['id'])) continue;
        $id = (string)$m['id'];
        $name = (string)($m['name'] ?? '');
        $stock = int_value($m['stock'] ?? 0);
        $unit = (string)($m['unit'] ?? '');
        $price = int_value($m['price'] ?? 0);
        $category = (string)($m['category'] ?? '');
        $medStmt->bind_param('ssisis', $id, $name, $stock, $unit, $price, $category);
        $medStmt->execute();
    }

    $visitStmt = $conn->prepare("INSERT INTO visits (id, animal_id, visit_date, poli, doctor, status, complaint, weight, temperature, exam_result, lab_result, diagnosis, prognosis, medical_action, notes, recommendations, total_cost, payment_status, billing_status, doctor_done_at, fo_billing_done_at, raw_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
    $visitMedStmt = $conn->prepare("INSERT INTO visit_medicines (visit_id, medicine_id, name, price, quantity, medicine_type, custom_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $chargeStmt = $conn->prepare("INSERT INTO visit_charges (visit_id, charge_name, charge_kind, price, quantity, unit_price, charge_source, master_table, master_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $inpatientStmt = $conn->prepare("INSERT INTO inpatient_records (visit_id, animal_id, hospitalization_type, is_active, ready_for_checkout, deposit_amount, deposit_method, deposit_bank) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $paymentStmt = $conn->prepare("INSERT INTO payments (id, visit_id, payment_date, payment_type, method, bank, total_amount, discount_percent, discount_amount, paid_amount, received_amount, change_amount, debt_total, debt_paid, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $installStmt = $conn->prepare("INSERT INTO payment_installments (id, payment_id, visit_id, method, bank, amount, received_amount, applied_amount, change_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    foreach ($visits as $v) {
        if (empty($v['id'])) continue;
        $id = (string)$v['id'];
        $animalId = nullable_string($v['patientId'] ?? null);
        $date = mysql_datetime($v['visitDate'] ?? null);
        $poli = (string)($v['poli'] ?? '');
        $doctor = (string)($v['doctor'] ?? '');
        $status = (string)($v['status'] ?? 'pending');
        $complaint = (string)($v['complaint'] ?? '');
        $weight = (string)($v['weight'] ?? '');
        $temp = (string)($v['temperature'] ?? '');
        $exam = (string)($v['examResult'] ?? '');
        $lab = (string)($v['labResult'] ?? '');
        $diagnosis = (string)($v['diagnosis'] ?? '');
        $prognosis = (string)($v['prognosis'] ?? '');
        $medicalAction = (string)($v['medicalAction'] ?? '');
        $notes = (string)($v['notes'] ?? '');
        $recommendations = (string)($v['recommendations'] ?? '');
        $totalCost = int_value($v['totalCost'] ?? 0);
        $paymentStatus = (string)($v['paymentStatus'] ?? 'Menunggu Pembayaran');
        $billingStatus = (string)($v['billingStatus'] ?? 'belum_ditagih');
        $doctorDoneAt = !empty($v['doctorDoneAt']) ? mysql_datetime($v['doctorDoneAt']) : null;
        $foBillingDoneAt = !empty($v['foBillingDoneAt']) ? mysql_datetime($v['foBillingDoneAt']) : null;
        $raw = json_encode($v, JSON_UNESCAPED_UNICODE);
        $visitStmt->bind_param('ssssssssssssssssisssss', $id, $animalId, $date, $poli, $doctor, $status, $complaint, $weight, $temp, $exam, $lab, $diagnosis, $prognosis, $medicalAction, $notes, $recommendations, $totalCost, $paymentStatus, $billingStatus, $doctorDoneAt, $foBillingDoneAt, $raw);
        $visitStmt->execute();

        $items = is_array($v['medicineItems'] ?? null) ? $v['medicineItems'] : [];
        foreach ($items as $item) {
            $medicineId = valid_existing_medicine_id($conn, $item['medicineId'] ?? null);
            $name = (string)($item['name'] ?? '');
            $price = int_value($item['price'] ?? 0);
            $qty = int_value($item['quantity'] ?? 0);
            $type = (string)($item['medicineType'] ?? '');
            $custom = (string)($item['customName'] ?? '');
            $visitMedStmt->bind_param('sssiiss', $id, $medicineId, $name, $price, $qty, $type, $custom);
            $visitMedStmt->execute();
        }

        $charges = is_array($v['additionalCharges'] ?? null) ? $v['additionalCharges'] : [];
        foreach ($charges as $charge) {
            $chargeName = (string)($charge['name'] ?? '');
            $kind = (string)($charge['kind'] ?? 'jasa');
            $price = int_value($charge['price'] ?? 0);
            $quantity = int_value($charge['quantity'] ?? $charge['days'] ?? 1);
            if ($quantity <= 0) $quantity = 1;
            $unitPrice = int_value($charge['unitPrice'] ?? ($quantity > 0 ? floor($price / $quantity) : $price));
            $source = (string)($charge['chargeSource'] ?? 'fo');
            $masterTable = nullable_string($charge['masterTable'] ?? null);
            $masterId = nullable_string($charge['masterId'] ?? null);
            $chargeStmt->bind_param('sssiiisss', $id, $chargeName, $kind, $price, $quantity, $unitPrice, $source, $masterTable, $masterId);
            $chargeStmt->execute();
        }

        if (!empty($v['hospitalizationType']) || !empty($v['isHospitalized']) || int_value($v['depositAmount'] ?? 0) > 0) {
            $hType = (string)($v['hospitalizationType'] ?? 'Rawat Inap');
            $isActive = bool_value($v['isHospitalized'] ?? false);
            $ready = bool_value($v['inpatientReadyForCheckout'] ?? false);
            $deposit = int_value($v['depositAmount'] ?? 0);
            $depMethod = (string)($v['depositMethod'] ?? '');
            $depBank = (string)($v['depositBank'] ?? '');
            $inpatientStmt->bind_param('sssiiiss', $id, $animalId, $hType, $isActive, $ready, $deposit, $depMethod, $depBank);
            $inpatientStmt->execute();
        }

        if (!empty($v['paymentStatus']) || !empty($v['paymentMethod']) || int_value($v['depositAmount'] ?? 0) > 0 || int_value($v['debtTotal'] ?? 0) > 0) {
            $paymentId = 'pay_' . substr(sha1($id), 0, 20);
            $pDate = mysql_datetime($v['paymentDate'] ?? $v['visitDate'] ?? null);
            $paymentType = int_value($v['debtTotal'] ?? 0) > 0 ? 'hutang' : 'final';
            $method = (string)($v['paymentMethod'] ?? '');
            $bank = (string)($v['paymentBank'] ?? '');
            $discountPercent = int_value($v['discountPercent'] ?? 0);
            $discountAmount = int_value($v['discountAmount'] ?? 0);
            $paidAmount = int_value($v['paidAmount'] ?? $v['cashReceived'] ?? 0);
            $receivedAmount = int_value($v['cashReceived'] ?? $paidAmount);
            $changeAmount = int_value($v['changeAmount'] ?? 0);
            $debtTotal = int_value($v['debtTotal'] ?? 0);
            $debtPaid = int_value($v['debtPaid'] ?? 0);
            $pStatus = (string)($v['paymentStatus'] ?? 'Menunggu Pembayaran');
            $paymentStmt->bind_param('ssssssiiiiiiiis', $paymentId, $id, $pDate, $paymentType, $method, $bank, $totalCost, $discountPercent, $discountAmount, $paidAmount, $receivedAmount, $changeAmount, $debtTotal, $debtPaid, $pStatus);
            $paymentStmt->execute();

            $installments = is_array($v['installmentPayments'] ?? null) ? $v['installmentPayments'] : [];
            foreach ($installments as $ins) {
                $insId = (string)($ins['id'] ?? ('ins_' . bin2hex(random_bytes(4))));
                $insMethod = (string)($ins['method'] ?? '');
                $insBank = (string)($ins['bank'] ?? '');
                $amount = int_value($ins['amount'] ?? 0);
                $received = int_value($ins['receivedAmount'] ?? $amount);
                $applied = int_value($ins['appliedAmount'] ?? $amount);
                $change = int_value($ins['changeAmount'] ?? 0);
                $created = mysql_datetime($ins['createdAt'] ?? null);
                $installStmt->bind_param('sssssiiiis', $insId, $paymentId, $id, $insMethod, $insBank, $amount, $received, $applied, $change, $created);
                $installStmt->execute();
            }
        }
    }

    $invStmt = $conn->prepare("INSERT INTO inventory_transactions (id, medicine_id, medicine_name, type, quantity, unit_price, total, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($inventory as $it) {
        if (empty($it['id'])) continue;
        $id = (string)$it['id'];
        $medicineId = valid_existing_medicine_id($conn, $it['medicineId'] ?? null);
        $medicineName = (string)($it['medicineName'] ?? '');
        $type = (string)($it['type'] ?? 'keluar');
        $qty = int_value($it['quantity'] ?? 0);
        $unitPrice = int_value($it['unitPrice'] ?? 0);
        $total = int_value($it['total'] ?? ($qty * $unitPrice));
        $note = (string)($it['note'] ?? '');
        $created = mysql_datetime($it['createdAt'] ?? null);
        $invStmt->bind_param('ssssiiiss', $id, $medicineId, $medicineName, $type, $qty, $unitPrice, $total, $note, $created);
        $invStmt->execute();
    }

    $finStmt = $conn->prepare("INSERT INTO finance_entries (id, type, category, title, amount, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    foreach ($finance as $f) {
        if (empty($f['id'])) continue;
        $id = (string)$f['id'];
        $type = (string)($f['type'] ?? 'pemasukan');
        $category = (string)($f['category'] ?? 'Layanan Klinik');
        $title = (string)($f['title'] ?? '');
        $amount = int_value($f['amount'] ?? 0);
        $note = (string)($f['note'] ?? '');
        $created = mysql_datetime($f['createdAt'] ?? null);
        $finStmt->bind_param('ssssiss', $id, $type, $category, $title, $amount, $note, $created);
        $finStmt->execute();
    }
}

function relational_state_has_data(mysqli $conn): bool {
    // Jangan hitung master obat sebagai data operasional. Kalau baru reset DB, React boleh memakai localStorage/seed dan menyimpan ulang.
    return table_has_rows($conn, 'animals') || table_has_rows($conn, 'visits') || table_has_rows($conn, 'finance_entries') || table_has_rows($conn, 'inventory_transactions');
}
?>
