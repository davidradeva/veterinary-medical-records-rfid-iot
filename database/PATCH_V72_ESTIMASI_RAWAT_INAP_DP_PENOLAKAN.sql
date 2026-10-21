-- PATCH V72 - Estimasi rawat inap dokter, DP dibayar di pembayaran, dan penolakan lebih lengkap
-- Jalankan di database aktif: vetcarew_hugmebyvet
-- Aman: tidak DROP/TRUNCATE/DELETE data lama.

ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS doctor_estimate_total int(11) NOT NULL DEFAULT 0 AFTER total_cost,
  ADD COLUMN IF NOT EXISTS doctor_estimate_json longtext DEFAULT NULL AFTER doctor_estimate_total,
  ADD COLUMN IF NOT EXISTS doctor_estimate_printed_at datetime DEFAULT NULL AFTER doctor_estimate_json,
  ADD COLUMN IF NOT EXISTS sent_to_fo_billing_at datetime DEFAULT NULL AFTER doctor_estimate_printed_at,
  ADD COLUMN IF NOT EXISTS fo_payment_partial_allowed tinyint(1) NOT NULL DEFAULT 0 AFTER sent_to_fo_billing_at;

ALTER TABLE inpatient_records
  ADD COLUMN IF NOT EXISTS estimated_days int(11) NOT NULL DEFAULT 1 AFTER days,
  ADD COLUMN IF NOT EXISTS estimated_daily_price int(11) NOT NULL DEFAULT 0 AFTER daily_price,
  ADD COLUMN IF NOT EXISTS estimated_total_price int(11) NOT NULL DEFAULT 0 AFTER total_price,
  ADD COLUMN IF NOT EXISTS estimate_json longtext DEFAULT NULL AFTER notes;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS partial_payment_allowed tinyint(1) NOT NULL DEFAULT 0 AFTER payment_type,
  ADD COLUMN IF NOT EXISTS remaining_amount int(11) NOT NULL DEFAULT 0 AFTER paid_amount;

ALTER TABLE visit_charges
  ADD COLUMN IF NOT EXISTS is_estimate tinyint(1) NOT NULL DEFAULT 0 AFTER charge_source,
  ADD COLUMN IF NOT EXISTS final_price int(11) DEFAULT NULL AFTER price;

ALTER TABLE inpatient_refusal_letters
  ADD COLUMN IF NOT EXISTS owner_relation_note varchar(150) DEFAULT NULL AFTER acting_as,
  ADD COLUMN IF NOT EXISTS rejected_action_1 varchar(180) DEFAULT NULL AFTER signature_owner_name,
  ADD COLUMN IF NOT EXISTS rejected_action_2 varchar(180) DEFAULT NULL AFTER rejected_action_1,
  ADD COLUMN IF NOT EXISTS rejected_action_3 varchar(180) DEFAULT NULL AFTER rejected_action_2,
  ADD COLUMN IF NOT EXISTS statement_maker_name varchar(150) DEFAULT NULL AFTER witness_name,
  ADD COLUMN IF NOT EXISTS suggestion_1 varchar(200) DEFAULT NULL AFTER suggestion,
  ADD COLUMN IF NOT EXISTS suggestion_2 varchar(200) DEFAULT NULL AFTER suggestion_1,
  ADD COLUMN IF NOT EXISTS suggestion_3 varchar(200) DEFAULT NULL AFTER suggestion_2;
