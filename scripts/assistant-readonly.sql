-- Read-only MySQL user for the EMS assistant's query_database tool.
--
-- The assistant writes its own SELECT statements; this user is the hard
-- security wall: it can read the v_* views (which already exclude
-- soft-deleted rows, password hashes, and file paths) and nothing else —
-- no base tables, no writes, regardless of what SQL reaches the server.
--
-- Usage:
--   1. CHANGE THE PASSWORD below (and mirror it in DATABASE_URL_READONLY in .env).
--   2. Run this script as root, e.g. in phpMyAdmin / MySQL Workbench, or:
--        mysql -u root -p < scripts/assistant-readonly.sql
--
-- Re-runnable: CREATE USER IF NOT EXISTS + repeated GRANTs are idempotent.

-- mysql_native_password: the app's mariadb driver can't negotiate MySQL 8's
-- caching_sha2_password over plain TCP without extra options (localhost dev).
CREATE USER IF NOT EXISTS 'ems_assistant_ro'@'localhost' IDENTIFIED WITH mysql_native_password BY 'CHANGE_ME';

GRANT SELECT ON `ems_db`.`v_batches`    TO 'ems_assistant_ro'@'localhost';
GRANT SELECT ON `ems_db`.`v_persons`    TO 'ems_assistant_ro'@'localhost';
GRANT SELECT ON `ems_db`.`v_internees`  TO 'ems_assistant_ro'@'localhost';
GRANT SELECT ON `ems_db`.`v_tenures`    TO 'ems_assistant_ro'@'localhost';
GRANT SELECT ON `ems_db`.`v_cities`     TO 'ems_assistant_ro'@'localhost';
GRANT SELECT ON `ems_db`.`v_institutes` TO 'ems_assistant_ro'@'localhost';
GRANT SELECT ON `ems_db`.`v_degrees`    TO 'ems_assistant_ro'@'localhost';

FLUSH PRIVILEGES;

-- To change the password later:
--   ALTER USER 'ems_assistant_ro'@'localhost' IDENTIFIED BY 'new-password';
