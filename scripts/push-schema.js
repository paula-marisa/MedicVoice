import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Função para migrar o banco de dados
async function migrateDb() {
  try {
    console.log('Conectando ao banco de dados...');
    const connectionString = process.env.DATABASE_URL || '';
    
    if (!connectionString) {
      console.error('Variável DATABASE_URL não definida');
      process.exit(1);
    }
    
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    console.log('Executando migração do schema...');
    
    // Criar manualmente a tabela de access_requests se não existir
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS "access_requests" (
        "id" SERIAL PRIMARY KEY,
        "full_name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(50) NOT NULL,
        "professional_id" VARCHAR(100) NOT NULL,
        "mechanographic_number" VARCHAR(100) NOT NULL,
        "specialty" VARCHAR(100) NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "reviewed_by" INTEGER,
        "review_date" TIMESTAMP WITH TIME ZONE,
        "comments" TEXT,
        "temporary_password" VARCHAR(255)
      );
    `);
    
    console.log('Tabela "access_requests" criada ou já existia');
    
    // Adicionar novos campos à tabela de usuários se não existirem
    await client.unsafe(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "professional_id" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "mechanographic_number" VARCHAR(100);
    `);
    
    console.log('Campos profissionais adicionados à tabela "users"');
    
    console.log('Migração concluída com sucesso');
  } catch (error) {
    console.error('Erro durante a migração:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateDb();