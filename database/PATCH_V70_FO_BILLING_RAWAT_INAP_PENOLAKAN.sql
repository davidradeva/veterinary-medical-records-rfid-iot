-- PATCH V70 - FO billing, master rawat inap, dan surat penolakan rawat inap
-- Jalankan patch ini di database live vetcarew_hugmebyvet setelah backup.
-- Jangan import ulang file backup full karena bisa menimpa data live.

START TRANSACTION;

-- 1) Master rawat inap dibuat terpisah dari actions/services.
CREATE TABLE IF NOT EXISTS `inpatient_masters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `inpatient_name` varchar(150) NOT NULL,
  `price_min` int(11) NOT NULL DEFAULT 0,
  `price_max` int(11) DEFAULT NULL,
  `unit` varchar(30) NOT NULL DEFAULT 'hari',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_inpatient_name` (`inpatient_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Ambil data rawat inap/penitipan/day care yang sebelumnya masih tercampur di actions.
INSERT INTO `inpatient_masters` (`inpatient_name`, `price_min`, `price_max`, `unit`, `is_active`, `created_at`, `updated_at`, `deleted_at`)
SELECT TRIM(a.`action_name`) AS inpatient_name,
       COALESCE(a.`price_min`, 0) AS price_min,
       a.`price_max` AS price_max,
       'hari' AS unit,
       COALESCE(a.`is_active`, 1) AS is_active,
       NOW(),
       NOW(),
       NULL
FROM `actions` a
WHERE a.`deleted_at` IS NULL
  AND (
    LOWER(a.`action_name`) LIKE '%rawat inap%'
    OR LOWER(a.`action_name`) LIKE '%penitipan%'
    OR LOWER(a.`action_name`) LIKE '%day care%'
    OR LOWER(a.`action_name`) LIKE '%visit dokter%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM `inpatient_masters` im
    WHERE LOWER(TRIM(im.`inpatient_name`)) = LOWER(TRIM(a.`action_name`))
  );

-- 2) Perkuat tabel rawat inap per kunjungan.
ALTER TABLE `inpatient_records`
  ADD COLUMN IF NOT EXISTS `inpatient_master_id` int(11) DEFAULT NULL AFTER `hospitalization_type`,
  ADD COLUMN IF NOT EXISTS `start_date` date DEFAULT NULL AFTER `inpatient_master_id`,
  ADD COLUMN IF NOT EXISTS `end_date` date DEFAULT NULL AFTER `start_date`,
  ADD COLUMN IF NOT EXISTS `days` int(11) NOT NULL DEFAULT 1 AFTER `end_date`,
  ADD COLUMN IF NOT EXISTS `daily_price` int(11) NOT NULL DEFAULT 0 AFTER `days`,
  ADD COLUMN IF NOT EXISTS `total_price` int(11) NOT NULL DEFAULT 0 AFTER `daily_price`,
  ADD COLUMN IF NOT EXISTS `notes` text DEFAULT NULL AFTER `deposit_bank`,
  ADD COLUMN IF NOT EXISTS `checkout_at` datetime DEFAULT NULL AFTER `notes`,
  ADD COLUMN IF NOT EXISTS `deleted_at` datetime DEFAULT NULL AFTER `checkout_at`;

-- 3) Visit charges dibuat bisa menyimpan qty/hari/unit price dan sumber input FO.
ALTER TABLE `visit_charges`
  ADD COLUMN IF NOT EXISTS `quantity` int(11) NOT NULL DEFAULT 1 AFTER `price`,
  ADD COLUMN IF NOT EXISTS `unit_price` int(11) NOT NULL DEFAULT 0 AFTER `quantity`,
  ADD COLUMN IF NOT EXISTS `charge_source` varchar(30) DEFAULT 'fo' AFTER `unit_price`,
  ADD COLUMN IF NOT EXISTS `master_table` varchar(50) DEFAULT NULL AFTER `charge_source`,
  ADD COLUMN IF NOT EXISTS `master_id` int(11) DEFAULT NULL AFTER `master_table`;

-- Isi unit_price lama agar tidak kosong untuk data existing.
UPDATE `visit_charges`
SET `quantity` = IFNULL(NULLIF(`quantity`, 0), 1),
    `unit_price` = CASE
      WHEN IFNULL(`unit_price`, 0) = 0 THEN IFNULL(`price`, 0)
      ELSE `unit_price`
    END,
    `charge_source` = IFNULL(`charge_source`, 'fo')
WHERE `unit_price` = 0 OR `quantity` = 0 OR `charge_source` IS NULL;

-- 4) Visit medicines juga ditandai sumbernya dari FO.
ALTER TABLE `visit_medicines`
  ADD COLUMN IF NOT EXISTS `source_role` varchar(30) DEFAULT 'fo' AFTER `custom_name`;

UPDATE `visit_medicines`
SET `source_role` = IFNULL(`source_role`, 'fo')
WHERE `source_role` IS NULL;

-- 5) Status billing di visits untuk alur baru:
-- dokter mengisi medis -> FO input billing -> pembayaran.
ALTER TABLE `visits`
  ADD COLUMN IF NOT EXISTS `billing_status` varchar(40) DEFAULT 'belum_ditagih' AFTER `payment_status`,
  ADD COLUMN IF NOT EXISTS `doctor_done_at` datetime DEFAULT NULL AFTER `billing_status`,
  ADD COLUMN IF NOT EXISTS `fo_billing_done_at` datetime DEFAULT NULL AFTER `doctor_done_at`;

-- 6) Surat penolakan rawat inap dari FO.
CREATE TABLE IF NOT EXISTS `inpatient_refusal_letters` (
  `id` varchar(64) NOT NULL,
  `visit_id` varchar(64) DEFAULT NULL,
  `animal_id` varchar(64) NOT NULL,
  `owner_id` varchar(64) DEFAULT NULL,
  `refusal_date` datetime DEFAULT current_timestamp(),
  `owner_name_snapshot` varchar(150) DEFAULT NULL,
  `animal_name_snapshot` varchar(150) DEFAULT NULL,
  `customer_number_snapshot` varchar(30) DEFAULT NULL,
  `rfid_uid_snapshot` varchar(100) DEFAULT NULL,
  `doctor_name` varchar(100) DEFAULT NULL,
  `staff_name` varchar(100) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `recommended_treatment` text DEFAULT NULL,
  `risk_explanation` text DEFAULT NULL,
  `refusal_statement` text DEFAULT NULL,
  `signature_owner_name` varchar(150) DEFAULT NULL,
  `witness_name` varchar(150) DEFAULT NULL,
  `raw_json` longtext DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_refusal_visit` (`visit_id`),
  KEY `idx_refusal_animal` (`animal_id`),
  KEY `idx_refusal_owner` (`owner_id`),
  KEY `idx_refusal_date` (`refusal_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;

-- Cek setelah import:
-- SELECT COUNT(*) AS jumlah_master_rawat_inap FROM inpatient_masters WHERE deleted_at IS NULL;
-- SHOW TABLES LIKE 'inpatient_refusal_letters';
-- SHOW COLUMNS FROM visit_charges;
