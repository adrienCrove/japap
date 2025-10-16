const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPasswordColumn() {
  try {
    // Vérifier si la colonne password existe
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'User' AND column_name = 'password'
    `;

    console.log('Colonne password dans la table User:');
    console.log(JSON.stringify(result, null, 2));

    if (result.length === 0) {
      console.log('\n❌ La colonne password n\'existe PAS dans la table User');
    } else {
      console.log('\n✅ La colonne password existe dans la table User');
    }

  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasswordColumn();
