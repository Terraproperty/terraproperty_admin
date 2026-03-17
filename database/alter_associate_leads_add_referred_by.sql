ALTER TABLE associate_leads
ADD referred_by INT NULL;

-- Optionally add foreign key constraint if associate_program table exists
-- ALTER TABLE associate_leads
-- ADD CONSTRAINT fk_referred_by FOREIGN KEY (referred_by) REFERENCES associate_program(id);
