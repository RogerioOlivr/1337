-- Add unique constraint to cpf column
ALTER TABLE `Usuario` ADD UNIQUE INDEX `Usuario_cpf_key`(`cpf`);
