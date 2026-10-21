-- PATCH V71 - penyempurnaan alur rawat inap, DP FO, cicilan hutang, dan surat penolakan
-- Jalankan setelah PATCH V70. Aman dijalankan berulang karena memakai ADD COLUMN IF NOT EXISTS.
-- Tetap backup database dulu sebelum import.

START TRANSACTION;

-- Status tambahan untuk memastikan rawat inap dari dokter juga bisa muncul di billing FO.
ALTER TABLE `visits`
  ADD COLUMN IF NOT EXISTS `fo_billing_ready` tinyint(1) NOT NULL DEFAULT 0 AFTER `fo_billing_done_at`,
  ADD COLUMN IF NOT EXISTS `inpatient_dp` int(11) NOT NULL DEFAULT 0 AFTER `fo_billing_ready`,
  ADD COLUMN IF NOT EXISTS `debt_installment_months` int(11) DEFAULT NULL AFTER `inpatient_dp`,
  ADD COLUMN IF NOT EXISTS `debt_monthly_amount` int(11) DEFAULT NULL AFTER `debt_installment_months`,
  ADD COLUMN IF NOT EXISTS `debt_due_day` int(11) DEFAULT NULL AFTER `debt_monthly_amount`,
  ADD COLUMN IF NOT EXISTS `debt_start_date` datetime DEFAULT NULL AFTER `debt_due_day`,
  ADD COLUMN IF NOT EXISTS `debt_reminder_last_sent` datetime DEFAULT NULL AFTER `debt_start_date`;

-- Kolom cicilan di tabel payments untuk arsip tambahan jika dibutuhkan.
ALTER TABLE `payments`
  ADD COLUMN IF NOT EXISTS `installment_months` int(11) DEFAULT NULL AFTER `debt_paid`,
  ADD COLUMN IF NOT EXISTS `monthly_amount` int(11) DEFAULT NULL AFTER `installment_months`,
  ADD COLUMN IF NOT EXISTS `due_day` int(11) DEFAULT NULL AFTER `monthly_amount`,
  ADD COLUMN IF NOT EXISTS `debt_start_date` datetime DEFAULT NULL AFTER `due_day`,
  ADD COLUMN IF NOT EXISTS `reminder_last_sent` datetime DEFAULT NULL AFTER `debt_start_date`;

-- Lengkapi surat penolakan. Field utama tetap disimpan juga di raw_json oleh API.
ALTER TABLE `inpatient_refusal_letters`
  ADD COLUMN IF NOT EXISTS `owner_age` varchar(30) DEFAULT NULL AFTER `owner_name_snapshot`,
  ADD COLUMN IF NOT EXISTS `owner_address` text DEFAULT NULL AFTER `owner_age`,
  ADD COLUMN IF NOT EXISTS `owner_phone` varchar(50) DEFAULT NULL AFTER `owner_address`,
  ADD COLUMN IF NOT EXISTS `acting_as` varchar(100) DEFAULT NULL AFTER `owner_phone`,
  ADD COLUMN IF NOT EXISTS `animal_age_snapshot` varchar(50) DEFAULT NULL AFTER `animal_name_snapshot`,
  ADD COLUMN IF NOT EXISTS `animal_type_gender_snapshot` varchar(150) DEFAULT NULL AFTER `animal_age_snapshot`,
  ADD COLUMN IF NOT EXISTS `temporary_diagnosis` text DEFAULT NULL AFTER `diagnosis`,
  ADD COLUMN IF NOT EXISTS `refusal_reason` text DEFAULT NULL AFTER `reason`,
  ADD COLUMN IF NOT EXISTS `suggestion` text DEFAULT NULL AFTER `witness_name`,
  ADD COLUMN IF NOT EXISTS `letter_location` varchar(100) DEFAULT 'Bekasi' AFTER `suggestion`;

COMMIT;

-- Cek setelah import:
-- SHOW COLUMNS FROM visits LIKE 'debt_installment_months';
-- SHOW COLUMNS FROM payments LIKE 'installment_months';
-- SHOW COLUMNS FROM inpatient_refusal_letters LIKE 'suggestion';
